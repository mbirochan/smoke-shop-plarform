import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";
import { users } from "./users";

const geography = customType<{ data: string }>({
  dataType() {
    return "geography(point, 4326)";
  },
});

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    location: geography("location").notNull(),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    licenseNumber: text("license_number").notNull(),
    licenseExpiry: date("license_expiry").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    operatingHours: jsonb("operating_hours"),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0"),
    reviewCount: integer("review_count").default(0).notNull(),
    settings: jsonb("settings").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("stores_slug_idx").on(table.slug),
    index("stores_location_idx").using("gist", table.location),
    index("stores_owner_id_idx").on(table.ownerId),
  ],
);

export const storesRelations = relations(stores, ({ one }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
}));

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
