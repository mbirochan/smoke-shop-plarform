import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

function createRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn("Redis not configured — rate limiting disabled");
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = createRedisClient();

function createRateLimiter(requests: number, window: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
  });
}

export const loginRateLimit = createRateLimiter(5, "15 m");
export const registerRateLimit = createRateLimiter(3, "1 h");
export const forgotPasswordRateLimit = createRateLimiter(3, "1 h");
export const checkoutRateLimit = createRateLimiter(10, "1 h");
export const idvRateLimit = createRateLimiter(3, "24 h");

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    return { success: true, remaining: -1 };
  }

  const result = await limiter.limit(identifier);
  if (!result.success) {
    logger.warn("Rate limit exceeded", { identifier });
  }
  return { success: result.success, remaining: result.remaining };
}
