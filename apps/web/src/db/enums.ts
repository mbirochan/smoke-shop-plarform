import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "store_owner",
  "store_staff",
  "platform_admin",
]);

export const idvStatusEnum = pgEnum("idv_status", [
  "none",
  "pending",
  "verified",
  "rejected",
  "expired",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["pickup", "delivery"]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "completed",
  "rewarded",
]);
