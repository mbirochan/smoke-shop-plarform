import { z } from "zod";
import { eq, ilike, and, sql, desc, lt, or } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { stores, users, notifications } from "@/db";
import { createStoreSchema, updateStoreSchema } from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { generateUniqueStoreSlug } from "@/lib/slug";

export const adminStoreRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        status: z.enum(["all", "active", "pending", "suspended"]).default("all"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.status === "active") {
        conditions.push(eq(stores.isActive, true), eq(stores.isVerified, true));
      } else if (input.status === "pending") {
        conditions.push(eq(stores.isActive, false), eq(stores.isVerified, false));
      } else if (input.status === "suspended") {
        conditions.push(eq(stores.isActive, false), eq(stores.isVerified, true));
      }

      if (input.search) {
        conditions.push(
          or(
            ilike(stores.name, `%${input.search}%`),
            ilike(stores.city, `%${input.search}%`),
          ),
        );
      }

      if (input.cursor) {
        conditions.push(lt(stores.id, input.cursor));
      }

      const items = await ctx.db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          city: stores.city,
          state: stores.state,
          isActive: stores.isActive,
          isVerified: stores.isVerified,
          createdAt: stores.createdAt,
          ownerName: users.fullName,
          ownerEmail: users.email,
        })
        .from(stores)
        .leftJoin(users, eq(stores.ownerId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(stores.createdAt))
        .limit(input.limit + 1);

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      return { items: data, nextCursor };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.id, input.id),
        with: { owner: true },
      });
      if (!store) throw new Error("Store not found");
      return store;
    }),

  create: adminProcedure
    .input(createStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = await generateUniqueStoreSlug(input.name);
      const ownerId = input.ownerId ?? ctx.session.user.id;

      const [store] = await ctx.db
        .insert(stores)
        .values({
          name: input.name,
          slug,
          description: input.description,
          phone: input.phone,
          email: input.email,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          city: input.city,
          state: input.state,
          zip: input.zip,
          location: sql`ST_MakePoint(0, 0)::geography`,
          licenseNumber: input.licenseNumber,
          licenseExpiry: input.licenseExpiry,
          ownerId,
          isActive: false,
          isVerified: false,
        })
        .returning();

      if (store) {
        await createAuditLog({
          userId: ctx.session.user.id,
          action: "store.created",
          resourceType: "store",
          resourceId: store.id,
          metadata: { storeName: input.name, slug },
        });
      }

      return store;
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().uuid(), data: updateStoreSchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(stores)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(stores.id, input.id))
        .returning();

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "store.updated",
        resourceType: "store",
        resourceId: input.id,
        metadata: { changes: Object.keys(input.data) },
      });

      return updated;
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(stores)
        .set({ isActive: true, isVerified: true, updatedAt: new Date() })
        .where(eq(stores.id, input.id))
        .returning();

      if (updated) {
        await ctx.db.insert(notifications).values({
          userId: updated.ownerId,
          type: "store_approved",
          title: "Store Approved",
          body: `Your store "${updated.name}" has been approved and is now active.`,
          data: { storeId: updated.id },
        });

        await createAuditLog({
          userId: ctx.session.user.id,
          action: "store.approved",
          resourceType: "store",
          resourceId: input.id,
          metadata: { storeName: updated.name },
        });
      }

      return updated;
    }),

  suspend: adminProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(stores)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(stores.id, input.id))
        .returning();

      if (updated) {
        await ctx.db.insert(notifications).values({
          userId: updated.ownerId,
          type: "store_suspended",
          title: "Store Suspended",
          body: `Your store "${updated.name}" has been suspended.${input.reason ? ` Reason: ${input.reason}` : ""}`,
          data: { storeId: updated.id },
        });

        await createAuditLog({
          userId: ctx.session.user.id,
          action: "store.suspended",
          resourceType: "store",
          resourceId: input.id,
          metadata: { storeName: updated.name, reason: input.reason },
        });
      }

      return updated;
    }),
});
