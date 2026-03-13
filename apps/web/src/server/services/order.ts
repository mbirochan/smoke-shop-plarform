import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/db";

const ORDER_SEQ_KEY = "order:seq";

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Try Redis first for atomic increment
  const { getRedis } = await import("@/lib/redis");
  const redis = getRedis();

  let seq: number;
  if (redis) {
    seq = await redis.incr(ORDER_SEQ_KEY);
  } else {
    // Fallback: count existing orders
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    seq = (result[0]?.count ?? 0) + 1;
  }

  return `SS-${year}-${String(seq).padStart(5, "0")}`;
}

export function calculateDeliveryFee(distanceMiles: number): number {
  if (distanceMiles <= 0) return 0;
  const baseFee = 4.99;
  const perMileRate = 0.5;
  return Math.round((baseFee + distanceMiles * perMileRate) * 100) / 100;
}

export function calculateTax(subtotal: number, taxRate = 0.0825): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}
