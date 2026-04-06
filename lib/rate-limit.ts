import { LRUCache } from "lru-cache";

interface RateLimitEntry {
  count: number;
}

/**
 * Creates an IP-based rate limiter using LRU cache.
 * Each entry TTL matches the window, so counts auto-expire.
 */
export function rateLimit(limit: number, windowMs: number) {
  const cache = new LRUCache<string, RateLimitEntry>({
    max: 500,
    ttl: windowMs,
  });

  return {
    check(ip: string): { success: boolean; remaining: number } {
      const entry = cache.get(ip) ?? { count: 0 };
      if (entry.count >= limit) {
        return { success: false, remaining: 0 };
      }
      entry.count += 1;
      cache.set(ip, entry);
      return { success: true, remaining: limit - entry.count };
    },
  };
}

/** 100 requests per minute — used on search API */
export const searchLimiter = rateLimit(100, 60_000);
