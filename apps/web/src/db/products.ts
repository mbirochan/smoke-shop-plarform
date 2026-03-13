import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { stores } from "./stores";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    brand: text("brand"),
    sku: text("sku"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0.0825").notNull(),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    weightGrams: integer("weight_grams"),
    isActive: boolean("is_active").default(true).notNull(),
    isAgeRestricted: boolean("is_age_restricted").default(true).notNull(),
    minimumAge: integer("minimum_age").default(21).notNull(),
    images: jsonb("images").default(sql`'[]'::jsonb`),
    attributes: jsonb("attributes").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_store_slug_idx").on(table.storeId, table.slug),
    index("products_store_id_idx").on(table.storeId),
    index("products_category_id_idx").on(table.categoryId),
  ],
);

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
