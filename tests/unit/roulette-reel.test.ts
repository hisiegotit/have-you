import { describe, expect, it } from "vitest";
import {
  REEL_ITEM_WIDTH,
  REEL_PITCH,
  REEL_WINNER_SLOT,
  buildReelPlan,
  randomInt,
} from "@/lib/roulette-reel";

/** Deterministic RandomInt that always returns the lowest value. */
const alwaysZero = () => 0;

/** Deterministic RandomInt cycling through a fixed script of draws. */
function scripted(values: number[]) {
  let i = 0;
  return (max: number) => values[i++ % values.length] % max;
}

describe("buildReelPlan", () => {
  it("throws on an empty pool", () => {
    expect(() => buildReelPlan([])).toThrow(/must not be empty/);
  });

  it("places the winner at the winner slot", () => {
    const pool = ["a", "b", "c", "d"];
    const plan = buildReelPlan(pool, scripted([2, 0, 1, 3]));

    expect(plan.strip[REEL_WINNER_SLOT]).toBe(plan.winner);
    expect(pool).toContain(plan.winner);
  });

  it("lands the winner's centre under the marker within the card bounds", () => {
    const winnerCentre = REEL_WINNER_SLOT * REEL_PITCH + REEL_ITEM_WIDTH / 2;

    for (let run = 0; run < 200; run++) {
      const plan = buildReelPlan(["a", "b", "c"]);
      const deviation = Math.abs(plan.offsetPx - winnerCentre);
      expect(deviation).toBeLessThan(REEL_ITEM_WIDTH / 2);
    }
  });

  it("never repeats the same card in consecutive slots when the pool allows it", () => {
    const plan = buildReelPlan(["a", "b", "c"], alwaysZero);

    for (let i = 1; i < plan.strip.length; i++) {
      if (i === REEL_WINNER_SLOT || i === REEL_WINNER_SLOT + 1) continue;
      expect(plan.strip[i]).not.toBe(plan.strip[i - 1]);
    }
  });

  it("works with a single-item pool", () => {
    const plan = buildReelPlan(["only"]);

    expect(plan.winner).toBe("only");
    expect(new Set(plan.strip)).toEqual(new Set(["only"]));
  });

  it("only ever draws items from the pool", () => {
    const pool = ["a", "b", "c", "d", "e"];
    const plan = buildReelPlan(pool);

    plan.strip.forEach((item) => expect(pool).toContain(item));
  });

  it("spreads winners across the pool over many rolls", () => {
    const pool = ["a", "b", "c", "d"];
    const winners = new Set(
      Array.from({ length: 300 }, () => buildReelPlan(pool).winner),
    );

    expect(winners).toEqual(new Set(pool));
  });
});

describe("randomInt", () => {
  it("rejects a non-positive max", () => {
    expect(() => randomInt(0)).toThrow(/must be positive/);
  });

  it("stays within range", () => {
    for (let i = 0; i < 500; i++) {
      const value = randomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});
