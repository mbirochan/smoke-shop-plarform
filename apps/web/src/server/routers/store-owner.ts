import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { router, storeProcedure } from "../trpc";
import { stores } from "@/db";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  updateStoreSchema,
  updateOperatingHoursSchema,
} from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { generateUniqueStoreSlug } from "@/lib/slug";

export const storeOwnerRouter = router({
  getMyStore: storeProcedure.query(async ({ ctx }) => {
    const store = await ctx.db.query.stores.findFirst({
      where: eq(stores.ownerId, ctx.session.user.id),
    });
    return store ?? null;
  }),

  submitOnboarding: storeProcedure
    .input(
      z.object({
        step1: onboardingStep1Schema,
        step2: onboardingStep2Schema,
        step3: onboardingStep3Schema,
        step4: onboardingStep4Schema,
        logoUrl: z.string().url().optional(),
        bannerUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a store
      const existing = await ctx.db.query.stores.findFirst({
        where: eq(stores.ownerId, ctx.session.user.id),
      });
      if (existing) throw new Error("You already have a store registered");

      const slug = await generateUniqueStoreSlug(input.step1.name);

      const [store] = await ctx.db
        .insert(stores)
        .values({
          ownerId: ctx.session.user.id,
          name: input.step1.name,
          slug,
          description: input.step1.description,
          phone: input.step1.phone,
          email: input.step1.email,
          addressLine1: input.step2.addressLine1,
          addressLine2: input.step2.addressLine2,
          city: input.step2.city,
          state: input.step2.state,
          zip: input.step2.zip,
          location: sql`ST_MakePoint(0, 0)::geography`,
          licenseNumber: input.step3.licenseNumber,
          licenseExpiry: input.step3.licenseExpiry,
          operatingHours: input.step4.operatingHours,
          logoUrl: input.logoUrl,
          bannerUrl: input.bannerUrl,
          isActive: false,
          isVerified: false,
        })
        .returning();

      if (store) {
        await createAuditLog({
          userId: ctx.session.user.id,
          action: "store.onboarding_submitted",
          resourceType: "store",
          resourceId: store.id,
          metadata: { storeName: input.step1.name },
        });
      }

      return store;
    }),

  updateProfile: storeProcedure
    .input(updateStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.ownerId, ctx.session.user.id),
      });
      if (!store) throw new Error("Store not found");

      const [updated] = await ctx.db
        .update(stores)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(stores.id, store.id))
        .returning();

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "store.profile_updated",
        resourceType: "store",
        resourceId: store.id,
        metadata: { changes: Object.keys(input) },
      });

      return updated;
    }),

  updateHours: storeProcedure
    .input(updateOperatingHoursSchema)
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.ownerId, ctx.session.user.id),
      });
      if (!store) throw new Error("Store not found");

      const [updated] = await ctx.db
        .update(stores)
        .set({ operatingHours: input.operatingHours, updatedAt: new Date() })
        .where(eq(stores.id, store.id))
        .returning();

      await createAuditLog({
        userId: ctx.session.user.id,
        action: "store.hours_updated",
        resourceType: "store",
        resourceId: store.id,
      });

      return updated;
    }),
});
