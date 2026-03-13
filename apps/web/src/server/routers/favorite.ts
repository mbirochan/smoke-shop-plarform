import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { userFavorites } from "@/db";

export const favoriteRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, ctx.session.user.id),
      orderBy: [desc(userFavorites.createdAt)],
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            images: true,
            isActive: true,
            storeId: true,
          },
          with: {
            store: { columns: { name: true, slug: true } },
          },
        },
      },
    });

    // Filter out deactivated products
    return items.filter((f) => f.product?.isActive);
  }),

  toggle: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.userFavorites.findFirst({
        where: and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.productId, input.productId),
        ),
      });

      if (existing) {
        await ctx.db
          .delete(userFavorites)
          .where(eq(userFavorites.id, existing.id));
        return { favorited: false };
      }

      await ctx.db.insert(userFavorites).values({
        userId,
        productId: input.productId,
      });
      return { favorited: true };
    }),

  // Check if a list of products are favorited
  checkBatch: protectedProcedure
    .input(z.object({ productIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      if (input.productIds.length === 0) return {};

      const { inArray } = await import("drizzle-orm");
      const favorites = await ctx.db.query.userFavorites.findMany({
        where: and(
          eq(userFavorites.userId, ctx.session.user.id),
          inArray(userFavorites.productId, input.productIds),
        ),
        columns: { productId: true },
      });

      const set = new Set(favorites.map((f) => f.productId));
      const result: Record<string, boolean> = {};
      for (const id of input.productIds) {
        result[id] = set.has(id);
      }
      return result;
    }),
});
