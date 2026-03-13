import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  alt: z.string().optional(),
  order: z.number().int().min(0),
});

export const productAttributeSchema = z.object({
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(200),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
  sku: z.string().max(50).optional(),
  price: z.coerce.number().positive("Price must be positive").multipleOf(0.01),
  compareAtPrice: z.coerce.number().positive().multipleOf(0.01).optional(),
  costPrice: z.coerce.number().positive().multipleOf(0.01).optional(),
  taxRate: z.coerce.number().min(0).max(1).default(0.0825),
  quantity: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  weightGrams: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  isAgeRestricted: z.boolean().default(true),
  minimumAge: z.coerce.number().int().min(18).max(21).default(21),
  images: z.array(productImageSchema).max(5).optional(),
  attributes: z.array(productAttributeSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

export const bulkUpdateStatusSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  isActive: z.boolean(),
});

export const csvImportRowSchema = z.object({
  name: z.string().min(1),
  category_slug: z.string().optional(),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0).default(0),
  brand: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  age_restricted: z.coerce.boolean().default(true),
  minimum_age: z.coerce.number().int().min(18).max(21).default(21),
});

export const productSearchSchema = z.object({
  query: z.string().min(1).max(200),
  storeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductAttribute = z.infer<typeof productAttributeSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
