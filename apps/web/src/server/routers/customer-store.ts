import { z } from "zod";
import { eq, and, sql, desc, asc, lt, ilike } from "drizzle-orm";
import { router, publicProcedure } from "../trpc";
import { stores, products, categories } from "@/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export const customerStoreRouter = router({
  nearby: publicProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusMiles: z.number().min(1).max(50).default(10),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const radiusMeters = input.radiusMiles * 1609.34;
      // Round coords for cache key
      const cacheKey = `nearby:${input.lat.toFixed(2)}:${input.lng.toFixed(2)}:${input.radiusMiles}`;
      const cached = await cacheGet<unknown[]>(cacheKey);
      if (cached) return cached;

      const result = await ctx.db.execute(sql`
        SELECT
          s.id,
          s.name,
          s.slug,
          s.description,
          s.phone,
          s.address_line1,
          s.city,
          s.state,
          s.zip,
          s.logo_url,
          s.operating_hours,
          ST_Distance(
            s.location::geography,
            ST_MakePoint(${input.lng}, ${input.lat})::geography
          ) AS distance_meters
        FROM stores s
        WHERE s.is_active = true
          AND ST_DWithin(
            s.location::geography,
            ST_MakePoint(${input.lng}, ${input.lat})::geography,
            ${radiusMeters}
          )
        ORDER BY distance_meters ASC
        LIMIT ${input.limit}
      `);

      const data = result as unknown[];
      await cacheSet(cacheKey, data, 300); // 5min cache
      return data;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: and(eq(stores.slug, input.slug), eq(stores.isActive, true)),
      });
      if (!store) return null;
      return store;
    }),

  getProducts: publicProcedure
    .input(
      z.object({
        storeId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["name", "price_asc", "price_desc", "newest"]).default("name"),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(products.storeId, input.storeId),
        eq(products.isActive, true),
      ];

      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }
      if (input.search) {
        conditions.push(ilike(products.name, `%${input.search}%`));
      }
      if (input.cursor) {
        conditions.push(lt(products.id, input.cursor));
      }

      let orderBy;
      switch (input.sortBy) {
        case "price_asc":
          orderBy = [asc(products.price), desc(products.id)];
          break;
        case "price_desc":
          orderBy = [desc(products.price), desc(products.id)];
          break;
        case "newest":
          orderBy = [desc(products.createdAt), desc(products.id)];
          break;
        default:
          orderBy = [asc(products.name), desc(products.id)];
      }

      const items = await ctx.db.query.products.findMany({
        where: and(...conditions),
        orderBy,
        limit: input.limit + 1,
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          brand: true,
          price: true,
          compareAtPrice: true,
          quantity: true,
          lowStockThreshold: true,
          images: true,
          isAgeRestricted: true,
          categoryId: true,
        },
        with: { category: { columns: { name: true, slug: true } } },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      // Map stock status (don't expose exact numbers)
      const mapped = data.map((p) => ({
        ...p,
        stockStatus:
          p.quantity <= 0
            ? ("out_of_stock" as const)
            : p.quantity <= p.lowStockThreshold
              ? ("low_stock" as const)
              : ("in_stock" as const),
        quantity: undefined,
        lowStockThreshold: undefined,
      }));

      return { items: mapped, nextCursor };
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder)],
    });
  }),

  searchProducts: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        storeId: z.string().uuid().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(products.isActive, true),
        ilike(products.name, `%${input.query}%`),
      ];

      if (input.storeId) {
        conditions.push(eq(products.storeId, input.storeId));
      }
      if (input.cursor) {
        conditions.push(lt(products.id, input.cursor));
      }

      // Also join on active stores only
      const items = await ctx.db.query.products.findMany({
        where: and(...conditions),
        orderBy: [desc(products.createdAt), desc(products.id)],
        limit: input.limit + 1,
        columns: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          storeId: true,
          quantity: true,
          lowStockThreshold: true,
        },
        with: {
          store: { columns: { name: true, slug: true, city: true } },
          category: { columns: { name: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      const mapped = data.map((p) => ({
        ...p,
        stockStatus:
          p.quantity <= 0
            ? ("out_of_stock" as const)
            : p.quantity <= p.lowStockThreshold
              ? ("low_stock" as const)
              : ("in_stock" as const),
        quantity: undefined,
        lowStockThreshold: undefined,
      }));

      return { items: mapped, nextCursor };
    }),
});
