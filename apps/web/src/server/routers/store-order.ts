import { z } from "zod";
import { eq, and, desc, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, storeProcedure } from "../trpc";
import { orders, stores, notifications } from "@/db";
import { updateOrderStatusSchema } from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered"],
};

async function getStoreId(db: typeof import("@/lib/db").db, userId: string) {
  const store = await db.query.stores.findFirst({
    where: eq(stores.ownerId, userId),
    columns: { id: true },
  });
  if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
  return store.id;
}

export const storeOrderRouter = router({
  list: storeProcedure
    .input(
      z.object({
        status: z.enum(["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled", "all"]).default("all"),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const conditions = [eq(orders.storeId, storeId)];

      if (input.status !== "all") {
        conditions.push(eq(orders.status, input.status));
      }
      if (input.cursor) {
        conditions.push(lt(orders.id, input.cursor));
      }

      const items = await ctx.db.query.orders.findMany({
        where: and(...conditions),
        orderBy: [desc(orders.createdAt)],
        limit: input.limit + 1,
        with: {
          customer: { columns: { fullName: true, email: true, phone: true } },
          items: { columns: { productName: true, quantity: true, subtotal: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      return { items: data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
    }),

  getById: storeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.storeId, storeId)),
        with: {
          customer: { columns: { fullName: true, email: true, phone: true } },
          items: true,
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return order;
    }),

  updateStatus: storeProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.orderId), eq(orders.storeId, storeId)),
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      // Validate status transition
      const allowed = VALID_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${order.status} to ${input.status}`,
        });
      }

      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      };

      // Capture payment when preparing
      if (input.status === "preparing") {
        updateData.paymentStatus = "captured";
      }

      const [updated] = await ctx.db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, input.orderId))
        .returning();

      // Notify customer
      await ctx.db.insert(notifications).values({
        userId: order.customerId,
        type: "order_status",
        title: `Order #${order.orderNumber} updated`,
        body: `Your order is now: ${input.status.replace(/_/g, " ")}`,
        data: { orderId: order.id, status: input.status },
      });

      await createAuditLog({
        userId: ctx.session.user.id,
        action: `order.status_${input.status}`,
        resourceType: "order",
        resourceId: input.orderId,
        metadata: { from: order.status, to: input.status },
      });

      return updated;
    }),
});
