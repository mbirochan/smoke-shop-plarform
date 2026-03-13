import { z } from "zod";
import { eq, and, desc, asc, lt, gt, sql, ilike, inArray } from "drizzle-orm";
import { router, storeProcedure } from "../trpc";
import { products, stores } from "@/db";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  bulkUpdateStatusSchema,
  csvImportRowSchema,
} from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { updateStock, invalidateStockCache } from "../services/inventory";
import { generateSlug } from "@/lib/slug";

async function getStoreId(db: typeof import("@/lib/db").db, userId: string) {
  const store = await db.query.stores.findFirst({
    where: eq(stores.ownerId, userId),
    columns: { id: true },
  });
  if (!store) throw new Error("Store not found");
  return store.id;
}

async function generateUniqueProductSlug(
  db: typeof import("@/lib/db").db,
  storeId: string,
  name: string,
): Promise<string> {
  const baseSlug = generateSlug(name);
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        sql`${products.slug} = ${baseSlug} OR ${products.slug} LIKE ${baseSlug + "-%"}`,
      ),
    );

  if (existing.length === 0) return baseSlug;

  const slugs = new Set(existing.map((r) => r.slug));
  let counter = 2;
  while (slugs.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

export const storeProductRouter = router({
  list: storeProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        stockStatus: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).default("all"),
        isActive: z.boolean().optional(),
        sortBy: z.enum(["name", "price", "quantity", "createdAt"]).default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const conditions = [eq(products.storeId, storeId)];

      if (input.search) {
        conditions.push(ilike(products.name, `%${input.search}%`));
      }
      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }
      if (input.isActive !== undefined) {
        conditions.push(eq(products.isActive, input.isActive));
      }
      if (input.stockStatus === "out_of_stock") {
        conditions.push(eq(products.quantity, 0));
      } else if (input.stockStatus === "low_stock") {
        conditions.push(
          sql`${products.quantity} > 0 AND ${products.quantity} <= ${products.lowStockThreshold}`,
        );
      } else if (input.stockStatus === "in_stock") {
        conditions.push(gt(products.quantity, 0));
      }

      if (input.cursor) {
        conditions.push(lt(products.id, input.cursor));
      }

      const sortCol = {
        name: products.name,
        price: products.price,
        quantity: products.quantity,
        createdAt: products.createdAt,
      }[input.sortBy];
      const sortFn = input.sortDir === "asc" ? asc : desc;

      const items = await ctx.db.query.products.findMany({
        where: and(...conditions),
        orderBy: [sortFn(sortCol), desc(products.id)],
        limit: input.limit + 1,
        with: { category: { columns: { name: true } } },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      return { items: data, nextCursor };
    }),

  getById: storeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const product = await ctx.db.query.products.findFirst({
        where: and(eq(products.id, input.id), eq(products.storeId, storeId)),
        with: { category: true },
      });
      if (!product) throw new Error("Product not found");
      return product;
    }),

  create: storeProcedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);
    const slug = await generateUniqueProductSlug(ctx.db, storeId, input.name);

    const [product] = await ctx.db
      .insert(products)
      .values({
        storeId,
        slug,
        name: input.name,
        description: input.description,
        brand: input.brand,
        sku: input.sku,
        price: input.price.toFixed(2),
        compareAtPrice: input.compareAtPrice?.toFixed(2),
        costPrice: input.costPrice?.toFixed(2),
        taxRate: input.taxRate.toFixed(4),
        quantity: input.quantity,
        lowStockThreshold: input.lowStockThreshold,
        weightGrams: input.weightGrams,
        categoryId: input.categoryId,
        isAgeRestricted: input.isAgeRestricted,
        minimumAge: input.minimumAge,
        images: input.images ?? [],
        attributes: input.attributes ?? {},
      })
      .returning();

    await createAuditLog({
      userId: ctx.session.user.id,
      action: "product.created",
      resourceType: "product",
      resourceId: product?.id,
      metadata: { name: input.name },
    });

    return product;
  }),

  update: storeProcedure
    .input(z.object({ id: z.string().uuid(), data: updateProductSchema }))
    .mutation(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      const existing = await ctx.db.query.products.findFirst({
        where: and(eq(products.id, input.id), eq(products.storeId, storeId)),
      });
      if (!existing) throw new Error("Product not found");

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.description !== undefined) updateData.description = input.data.description;
      if (input.data.brand !== undefined) updateData.brand = input.data.brand;
      if (input.data.sku !== undefined) updateData.sku = input.data.sku;
      if (input.data.price !== undefined) updateData.price = input.data.price.toFixed(2);
      if (input.data.compareAtPrice !== undefined)
        updateData.compareAtPrice = input.data.compareAtPrice.toFixed(2);
      if (input.data.costPrice !== undefined)
        updateData.costPrice = input.data.costPrice.toFixed(2);
      if (input.data.taxRate !== undefined) updateData.taxRate = input.data.taxRate.toFixed(4);
      if (input.data.quantity !== undefined) updateData.quantity = input.data.quantity;
      if (input.data.lowStockThreshold !== undefined)
        updateData.lowStockThreshold = input.data.lowStockThreshold;
      if (input.data.weightGrams !== undefined) updateData.weightGrams = input.data.weightGrams;
      if (input.data.categoryId !== undefined) updateData.categoryId = input.data.categoryId;
      if (input.data.isAgeRestricted !== undefined)
        updateData.isAgeRestricted = input.data.isAgeRestricted;
      if (input.data.minimumAge !== undefined) updateData.minimumAge = input.data.minimumAge;
      if (input.data.images !== undefined) updateData.images = input.data.images;
      if (input.data.attributes !== undefined) updateData.attributes = input.data.attributes;

      const [updated] = await ctx.db
        .update(products)
        .set(updateData)
        .where(eq(products.id, input.id))
        .returning();

      if (input.data.quantity !== undefined) {
        await invalidateStockCache(input.id);
      }

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "product.updated",
        resourceType: "product",
        resourceId: input.id,
        metadata: { changes: Object.keys(input.data) },
      });

      return updated;
    }),

  delete: storeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);
      // Soft-deactivate: don't delete products that may have order history
      const [updated] = await ctx.db
        .update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(products.id, input.id), eq(products.storeId, storeId)))
        .returning();
      if (!updated) throw new Error("Product not found");

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "product.deactivated",
        resourceType: "product",
        resourceId: input.id,
      });

      return updated;
    }),

  updateStock: storeProcedure.input(updateStockSchema).mutation(async ({ ctx, input }) => {
    const storeId = await getStoreId(ctx.db, ctx.session.user.id);
    const product = await ctx.db.query.products.findFirst({
      where: and(eq(products.id, input.productId), eq(products.storeId, storeId)),
    });
    if (!product) throw new Error("Product not found");

    await updateStock(input.productId, input.quantity, ctx.session.user.id);
    return { productId: input.productId, quantity: input.quantity };
  }),

  bulkUpdateStatus: storeProcedure
    .input(bulkUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);

      await ctx.db
        .update(products)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(and(inArray(products.id, input.productIds), eq(products.storeId, storeId)));

      await createAuditLog({
        userId: ctx.session.user.id,
        action: input.isActive ? "product.bulk_activated" : "product.bulk_deactivated",
        resourceType: "product",
        metadata: { count: input.productIds.length },
      });

      return { updated: input.productIds.length };
    }),

  importCsv: storeProcedure
    .input(z.object({ rows: z.array(csvImportRowSchema).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const storeId = await getStoreId(ctx.db, ctx.session.user.id);

      // Resolve category slugs
      const allCategories = await ctx.db.query.categories.findMany({
        columns: { id: true, slug: true },
      });
      const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

      // Check for duplicate SKUs
      const skus = input.rows.filter((r) => r.sku).map((r) => r.sku!);
      const existingSkus = skus.length
        ? await ctx.db
            .select({ sku: products.sku })
            .from(products)
            .where(and(eq(products.storeId, storeId), inArray(products.sku, skus)))
        : [];
      const existingSkuSet = new Set(existingSkus.map((r) => r.sku));

      const imported: string[] = [];
      const skipped: string[] = [];

      for (const row of input.rows) {
        if (row.sku && existingSkuSet.has(row.sku)) {
          skipped.push(row.name);
          continue;
        }

        const slug = await generateUniqueProductSlug(ctx.db, storeId, row.name);
        const categoryId = row.category_slug ? catMap.get(row.category_slug) : undefined;

        await ctx.db.insert(products).values({
          storeId,
          slug,
          name: row.name,
          price: row.price.toFixed(2),
          quantity: row.quantity,
          brand: row.brand,
          sku: row.sku,
          description: row.description,
          isAgeRestricted: row.age_restricted,
          minimumAge: row.minimum_age,
          categoryId,
        });

        imported.push(row.name);
      }

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "product.csv_imported",
        resourceType: "product",
        metadata: { imported: imported.length, skipped: skipped.length },
      });

      return { imported: imported.length, skipped, total: input.rows.length };
    }),
});
