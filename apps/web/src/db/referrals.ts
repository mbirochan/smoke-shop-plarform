import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { referralStatusEnum } from "./enums";

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => users.id),
  referredId: uuid("referred_id")
    .notNull()
    .references(() => users.id),
  code: text("code").unique().notNull(),
  status: referralStatusEnum("status").notNull().default("pending"),
  rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
