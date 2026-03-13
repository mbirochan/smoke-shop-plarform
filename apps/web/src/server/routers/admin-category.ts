import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { categories } from "@/db";
import { categorySchema } from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { generateSlug } from "@/lib/slug";

export const adminCategoryRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    // Build tree structure
    const roots = allCategories.filter((c) => !c.parentId);
    const children = allCategories.filter((c) => c.parentId);

    return roots.map((root) => ({
      ...root,
      children: children
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }),

  create: adminProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      const slug = generateSlug(input.name);

      // Check for duplicate slug
      const existing = await ctx.db.query.categories.findFirst({
        where: eq(categories.slug, slug),
      });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const [category] = await ctx.db
        .insert(categories)
        .values({
          name: input.name,
          slug: finalSlug,
          description: input.description,
          parentId: input.parentId ?? null,
          sortOrder: input.sortOrder,
        })
        .returning();

      if (category) {
        await createAuditLog({
          userId: ctx.session.user.id,
          action: "category.created",
          resourceType: "category",
          resourceId: category.id,
          metadata: { name: input.name, parentId: input.parentId },
        });
      }

      return category;
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().uuid(), data: categorySchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { ...input.data };

      if (input.data.name) {
        updateData.slug = generateSlug(input.data.name);
      }

      const [updated] = await ctx.db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, input.id))
        .returning();

      if (updated) {
        await createAuditLog({
          userId: ctx.session.user.id,
          action: "category.updated",
          resourceType: "category",
          resourceId: input.id,
          metadata: { changes: Object.keys(input.data) },
        });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Move children to parent before deleting
      const category = await ctx.db.query.categories.findFirst({
        where: eq(categories.id, input.id),
      });

      if (category) {
        await ctx.db
          .update(categories)
          .set({ parentId: category.parentId })
          .where(eq(categories.parentId, input.id));

        await ctx.db.delete(categories).where(eq(categories.id, input.id));

        await createAuditLog({
          userId: ctx.session.user.id,
          action: "category.deleted",
          resourceType: "category",
          resourceId: input.id,
          metadata: { name: category.name },
        });
      }

      return { success: true };
    }),
});
