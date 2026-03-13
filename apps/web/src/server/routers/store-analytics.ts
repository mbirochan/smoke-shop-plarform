import { eq, sql, and, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, storeProcedure } from "../trpc";
import { orders, orderItems, products, stores, reviews } from "@/db";

async function getStoreId(db: typeof import("@/lib/db").db, userId: string) {
  const store = await db.query.stores.findFirst({
    where: eq(stores.ownerId, userId),
    columns: { id: true },
  });
  if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
  return store.id;
}

export const storeAnalyticsRouter = router({
  summary: storeProcedure.query(async ({ ctx }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's orders
    const [todayStats] = await ctx.db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          gte(orders.createdAt, todayStart),
        ),
      );

    // This week
    const [weekStats] = await ctx.db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          gte(orders.createdAt, weekStart),
        ),
      );

    // This month
    const [monthStats] = await ctx.db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          gte(orders.createdAt, monthStart),
        ),
      );

    // Active products count
    const [productStats] = await ctx.db
      .select({
        active: sql<number>`count(*) filter (where ${products.isActive} = true)::int`,
        lowStock: sql<number>`count(*) filter (where ${products.quantity} < 10 and ${products.isActive} = true)::int`,
      })
      .from(products)
      .where(eq(products.storeId, storeId));

    // Pending orders
    const [pendingStats] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          sql`${orders.status} IN ('confirmed', 'preparing', 'ready')`,
        ),
      );

    return {
      today: todayStats ?? { count: 0, revenue: "0" },
      week: weekStats ?? { count: 0, revenue: "0" },
      month: monthStats ?? { count: 0, revenue: "0" },
      activeProducts: productStats?.active ?? 0,
      lowStockProducts: productStats?.lowStock ?? 0,
      pendingOrders: pendingStats?.count ?? 0,
    };
  }),

  topProducts: storeProcedure.query(async ({ ctx }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);

    const topItems = await ctx.db
      .select({
        productName: orderItems.productName,
        totalQty: sql<number>`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql<string>`SUM(${orderItems.subtotal}::numeric)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.storeId, storeId))
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);

    return topItems;
  }),

  recentReviews: storeProcedure.query(async ({ ctx }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);

    const items = await ctx.db.query.reviews.findMany({
      where: eq(reviews.storeId, storeId),
      orderBy: [desc(reviews.createdAt)],
      limit: 5,
      with: {
        customer: { columns: { fullName: true } },
      },
    });

    return items;
  }),

  revenueChart: storeProcedure.query(async ({ ctx }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await ctx.db
      .select({
        date: sql<string>`DATE(${orders.createdAt})::text`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          gte(orders.createdAt, thirtyDaysAgo),
        ),
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return dailyRevenue;
  }),

  lowStockProducts: storeProcedure.query(async ({ ctx }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);

    const items = await ctx.db.query.products.findMany({
      where: and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        sql`${products.quantity} < 10`,
      ),
      orderBy: [products.quantity],
      limit: 10,
      columns: { id: true, name: true, quantity: true, sku: true },
    });

    return items;
  }),
});
