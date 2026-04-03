import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const limiter = rateLimit(3, 60_000);
    expect(limiter.check("1.2.3.4").success).toBe(true);
    expect(limiter.check("1.2.3.4").success).toBe(true);
    expect(limiter.check("1.2.3.4").success).toBe(true);
  });

  it("blocks the (limit+1)th request", () => {
    const limiter = rateLimit(30, 60_000);
    for (let i = 0; i < 30; i++) limiter.check("10.0.0.1");
    const result = limiter.check("10.0.0.1");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks IPs independently", () => {
    const limiter = rateLimit(2, 60_000);
    limiter.check("1.1.1.1");
    limiter.check("1.1.1.1");
    expect(limiter.check("1.1.1.1").success).toBe(false);
    expect(limiter.check("2.2.2.2").success).toBe(true);
  });

  it("decrements remaining on each request", () => {
    const limiter = rateLimit(5, 60_000);
    expect(limiter.check("1.2.3.4").remaining).toBe(4);
    expect(limiter.check("1.2.3.4").remaining).toBe(3);
  });
});
