import { eq, sql, desc } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { stores, users, auditLogs } from "@/db";

export const adminDashboardRouter = router({
  stats: adminProcedure.query(async ({ ctx }) => {
    const [storeStats] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${stores.isActive} = true and ${stores.isVerified} = true)::int`,
        pending: sql<number>`count(*) filter (where ${stores.isActive} = false and ${stores.isVerified} = false)::int`,
      })
      .from(stores);

    const [userStats] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        customers: sql<number>`count(*) filter (where ${users.role} = 'customer')::int`,
        storeOwners: sql<number>`count(*) filter (where ${users.role} = 'store_owner')::int`,
        admins: sql<number>`count(*) filter (where ${users.role} = 'platform_admin')::int`,
      })
      .from(users);

    return {
      stores: storeStats ?? { total: 0, active: 0, pending: 0 },
      users: userStats ?? { total: 0, customers: 0, storeOwners: 0, admins: 0 },
      orders: { total: 0, revenue: 0 },
    };
  }),

  recentActivity: adminProcedure.query(async ({ ctx }) => {
    const logs = await ctx.db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.fullName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    return logs;
  }),
});
