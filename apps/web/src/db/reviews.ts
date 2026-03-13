import { pgTable, uuid, text, boolean, integer, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { orders } from "./orders";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    storeReply: text("store_reply"),
    storeReplyAt: timestamp("store_reply_at", { mode: "date", withTimezone: true }),
    isVisible: boolean("is_visible").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    uniqueIndex("reviews_order_id_idx").on(table.orderId),
  ],
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(users, { fields: [reviews.customerId], references: [users.id] }),
  store: one(stores, { fields: [reviews.storeId], references: [stores.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
}));

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
