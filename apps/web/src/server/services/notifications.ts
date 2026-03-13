import { db } from "@/lib/db";
import { notifications } from "@/db";
import { cacheDel } from "@/lib/redis";

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(payload: NotificationPayload) {
  // 1. Create in-app notification
  await db.insert(notifications).values({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  });

  // 2. Invalidate unread count cache
  await cacheDel(`notifications:unread:${payload.userId}`);

  // 3. Email would be sent here in production (via Resend/SendGrid)
  // For MVP, we skip actual email sending
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { cacheGet, cacheSet } = await import("@/lib/redis");
  const cacheKey = `notifications:unread:${userId}`;

  const cached = await cacheGet<number>(cacheKey);
  if (cached !== null) return cached;

  const { count, sql } = await import("drizzle-orm");
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = false`,
    );

  const unread = result[0]?.count ?? 0;
  await cacheSet(cacheKey, unread, 300); // 5 min TTL
  return unread;
}
