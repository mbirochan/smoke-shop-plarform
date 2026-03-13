import { z } from "zod";
import { eq, ilike, desc, lt, and, or } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { users } from "@/db";
import { createAuditLog } from "@/lib/audit";

export const adminUserRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        role: z.enum(["all", "customer", "store_owner", "store_staff", "platform_admin"]).default("all"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.role !== "all") {
        conditions.push(eq(users.role, input.role));
      }

      if (input.search) {
        conditions.push(
          or(
            ilike(users.fullName, `%${input.search}%`),
            ilike(users.email, `%${input.search}%`),
          ),
        );
      }

      if (input.cursor) {
        conditions.push(lt(users.id, input.cursor));
      }

      const items = await ctx.db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          idvStatus: users.idvStatus,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit + 1);

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      return { items: data, nextCursor };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      if (!user) throw new Error("User not found");
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        role: z.enum(["customer", "store_owner", "store_staff", "platform_admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.id))
        .returning({ id: users.id, role: users.role, fullName: users.fullName });

      if (updated) {
        await createAuditLog({
          userId: ctx.session.user.id,
          action: "user.role_updated",
          resourceType: "user",
          resourceId: input.id,
          metadata: { newRole: input.role, userName: updated.fullName },
        });
      }

      return updated;
    }),
});
