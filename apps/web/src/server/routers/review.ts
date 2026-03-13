import { z } from "zod";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, storeProcedure, adminProcedure, publicProcedure } from "../trpc";
import { reviews, orders, stores } from "@/db";
import { createReviewSchema, replyReviewSchema } from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { sendNotification } from "../services/notifications";

export const reviewRouter = router({
  // Customer creates a review
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check order exists, belongs to user, and is delivered
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.orderId), eq(orders.customerId, userId)),
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only review delivered orders",
        });
      }

      // Check duplicate review
      const existing = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.orderId, input.orderId),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already reviewed this order",
        });
      }

      // Sanitize comment
      const comment = input.comment
        ? input.comment.replace(/<[^>]*>/g, "").slice(0, 500)
        : null;

      const review = (await ctx.db
        .insert(reviews)
        .values({
          customerId: userId,
          storeId: order.storeId,
          orderId: input.orderId,
          rating: input.rating,
          comment,
        })
        .returning())[0]!;

      // Update store average rating and review count
      await ctx.db
        .update(stores)
        .set({
          reviewCount: sql`${stores.reviewCount} + 1`,
          averageRating: sql`(
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE store_id = ${order.storeId} AND is_visible = true
          )`,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, order.storeId));

      // Notify store owner
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.id, order.storeId),
        columns: { ownerId: true, name: true },
      });

      if (store) {
        await sendNotification({
          userId: store.ownerId,
          type: "new_review",
          title: `New ${input.rating}-star review`,
          body: comment ? comment.slice(0, 100) : "No comment",
          data: { reviewId: review.id, storeId: order.storeId },
        });
      }

      await createAuditLog({
        userId,
        action: "review.created",
        resourceType: "review",
        resourceId: review.id,
        metadata: { orderId: input.orderId, rating: input.rating },
      });

      return review;
    }),

  // Public: list reviews for a store
  listByStore: publicProcedure
    .input(
      z.object({
        storeId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(reviews.storeId, input.storeId),
        eq(reviews.isVisible, true),
      ];
      if (input.cursor) {
        conditions.push(lt(reviews.id, input.cursor));
      }

      const items = await ctx.db.query.reviews.findMany({
        where: and(...conditions),
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit + 1,
        with: {
          customer: { columns: { fullName: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;

      // Mask customer names: "John Doe" -> "John D."
      const masked = data.map((r) => {
        const parts = r.customer?.fullName?.split(" ") ?? [];
        const displayName =
          parts.length > 1
            ? `${parts[0]} ${parts[parts.length - 1]?.[0]}.`
            : parts[0] ?? "Customer";
        return { ...r, customer: { displayName } };
      });

      return {
        items: masked,
        nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
      };
    }),

  // Store owner: reply to a review
  reply: storeProcedure
    .input(replyReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const review = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.id, input.reviewId),
        with: { store: { columns: { ownerId: true } } },
      });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      if (review.store.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your store" });
      }

      if (review.storeReply) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already replied to this review",
        });
      }

      const [updated] = await ctx.db
        .update(reviews)
        .set({
          storeReply: input.reply.replace(/<[^>]*>/g, "").slice(0, 500),
          storeReplyAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, input.reviewId))
        .returning();

      // Notify the reviewer
      await sendNotification({
        userId: review.customerId,
        type: "review_reply",
        title: "Store replied to your review",
        body: input.reply.slice(0, 100),
        data: { reviewId: review.id },
      });

      return updated;
    }),

  // Store owner: list reviews for their store
  storeList: storeProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.ownerId, ctx.session.user.id),
        columns: { id: true },
      });
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });

      const conditions = [eq(reviews.storeId, store.id)];
      if (input.cursor) conditions.push(lt(reviews.id, input.cursor));

      const items = await ctx.db.query.reviews.findMany({
        where: and(...conditions),
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit + 1,
        with: {
          customer: { columns: { fullName: true } },
          order: { columns: { orderNumber: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      return { items: data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
    }),

  // Admin: list all reviews
  adminList: adminProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        visible: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.visible !== undefined) {
        conditions.push(eq(reviews.isVisible, input.visible));
      }
      if (input.cursor) conditions.push(lt(reviews.id, input.cursor));

      const items = await ctx.db.query.reviews.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit + 1,
        with: {
          customer: { columns: { fullName: true, email: true } },
          store: { columns: { name: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      return { items: data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
    }),

  // Admin: hide/unhide review
  adminToggleVisibility: adminProcedure
    .input(z.object({ reviewId: z.string().uuid(), visible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.id, input.reviewId),
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

      await ctx.db
        .update(reviews)
        .set({ isVisible: input.visible, updatedAt: new Date() })
        .where(eq(reviews.id, input.reviewId));

      // Recalculate store average
      await ctx.db
        .update(stores)
        .set({
          averageRating: sql`(
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
            FROM reviews
            WHERE store_id = ${review.storeId} AND is_visible = true
          )`,
          reviewCount: sql`(
            SELECT COUNT(*)
            FROM reviews
            WHERE store_id = ${review.storeId} AND is_visible = true
          )`,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, review.storeId));

      await createAuditLog({
        userId: ctx.session.user.id,
        action: input.visible ? "review.unhidden" : "review.hidden",
        resourceType: "review",
        resourceId: input.reviewId,
      });

      return { success: true };
    }),
});
