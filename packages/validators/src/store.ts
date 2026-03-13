import { z } from "zod";
import { phoneSchema } from "./common";

export const onboardingStep1Schema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").max(100),
  phone: phoneSchema,
  email: z.string().email("Invalid email address"),
  description: z.string().max(500).optional(),
});

export const onboardingStep2Schema = z.object({
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Must be a 2-letter state code"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
});

export const onboardingStep3Schema = z.object({
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  tosAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

export const operatingHourSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  closed: z.boolean().default(false),
});

export const onboardingStep4Schema = z.object({
  operatingHours: z.object({
    mon: operatingHourSchema,
    tue: operatingHourSchema,
    wed: operatingHourSchema,
    thu: operatingHourSchema,
    fri: operatingHourSchema,
    sat: operatingHourSchema,
    sun: operatingHourSchema,
  }),
});

export const createStoreSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  phone: phoneSchema,
  email: z.string().email("Invalid email address"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Must be a 2-letter state code"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  ownerId: z.string().uuid().optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
});

export const updateOperatingHoursSchema = onboardingStep4Schema;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4Input = z.infer<typeof onboardingStep4Schema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type UpdateOperatingHoursInput = z.infer<typeof updateOperatingHoursSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
