/**
 * Pure geometry + randomness for the CS:GO-style movie reel.
 *
 * The reel is a flex strip anchored at the container's horizontal centre
 * (`left: 50%`). Translating it left by `offsetPx` puts the winning slot's
 * centre exactly under the centre marker.
 */

/** Poster card width in px. Must match the rendered card. */
export const REEL_ITEM_WIDTH = 132;
/** Gap between cards in px. Must match the flex gap. */
export const REEL_ITEM_GAP = 12;
/** Distance between two consecutive card centres. */
export const REEL_PITCH = REEL_ITEM_WIDTH + REEL_ITEM_GAP;

/** Slot index the winner always occupies — long enough to feel like a real spin. */
export const REEL_WINNER_SLOT = 40;
/** Extra slots after the winner so the strip never runs out on the right edge. */
const REEL_TAIL_SLOTS = 6;
/** Slots visible to the left of the marker before the spin starts. */
const REEL_START_SLOTS = 2;

/**
 * Max landing deviation from the winner card's centre, as a fraction of the
 * card width. Keeps the stop off dead-centre so every roll looks different
 * while staying unambiguously on the winning card.
 */
const REEL_JITTER_RATIO = 0.28;

/** Spin length in ms — lands on the silent beat right before the reveal hit. */
export const REEL_SPIN_DURATION_MS = 7000;

/** Where the strip sits before the spin starts. */
export const REEL_START_OFFSET = REEL_START_SLOTS * REEL_PITCH;

export interface ReelPlan<T> {
  /** Cards to render, winner sitting at `REEL_WINNER_SLOT`. */
  strip: T[];
  /** The selected item. */
  winner: T;
  /** Pixels to translate the strip left so the winner lands under the marker. */
  offsetPx: number;
}

/** Returns an integer in [0, max). `max` must be positive. */
export type RandomInt = (max: number) => number;

/** Crypto-backed uniform integer with rejection sampling; falls back to Math.random. */
export function randomInt(max: number): number {
  if (max <= 0) throw new Error("randomInt: max must be positive");

  const crypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (!crypto?.getRandomValues) return Math.floor(Math.random() * max);

  // Reject values in the incomplete final bucket to keep the draw uniform.
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % max;
}

/**
 * Builds the strip of cards to scroll past and the offset that lands the winner
 * under the centre marker.
 *
 * Filler slots are drawn at random from the pool, never repeating the card
 * directly before them so the reel does not look stuck.
 */
export function buildReelPlan<T>(pool: readonly T[], random: RandomInt = randomInt): ReelPlan<T> {
  if (pool.length === 0) throw new Error("buildReelPlan: pool must not be empty");

  const winner = pool[random(pool.length)];
  const stripLength = REEL_WINNER_SLOT + 1 + REEL_TAIL_SLOTS;
  const strip: T[] = [];

  for (let slot = 0; slot < stripLength; slot++) {
    if (slot === REEL_WINNER_SLOT) {
      strip.push(winner);
      continue;
    }
    strip.push(drawFiller(pool, strip[slot - 1], random));
  }

  const jitterRange = Math.round(REEL_ITEM_WIDTH * REEL_JITTER_RATIO * 2);
  const jitter = random(jitterRange + 1) - jitterRange / 2;
  const winnerCentre = REEL_WINNER_SLOT * REEL_PITCH + REEL_ITEM_WIDTH / 2;

  return { strip, winner, offsetPx: winnerCentre + jitter };
}

/** Picks a pool item that differs from `previous` when the pool allows it. */
function drawFiller<T>(pool: readonly T[], previous: T | undefined, random: RandomInt): T {
  const candidate = pool[random(pool.length)];
  if (pool.length === 1 || candidate !== previous) return candidate;

  // Shift by a non-zero amount so the retry cannot land on `previous` again.
  const index = pool.indexOf(candidate);
  return pool[(index + 1 + random(pool.length - 1)) % pool.length];
}
