"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Dices, Loader2, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MovieCardData } from "@/components/movie-card";
import {
  REEL_ITEM_GAP,
  REEL_ITEM_WIDTH,
  REEL_SPIN_DURATION_MS,
  REEL_START_OFFSET,
  REEL_WINNER_SLOT,
  buildReelPlan,
  type ReelPlan,
} from "@/lib/roulette-reel";

const SOUND_SRC = "/sounds/csgo-case-open-v2.mp3";
const SOUND_VOLUME = 0.7;
/** Deceleration curve: fast launch, long glide, hard stop — mirrors the case-open audio. */
const SPIN_EASING = "cubic-bezier(0.08, 0.72, 0.12, 1)";
/** Cards shown in the idle preview strip before the first roll. */
const PREVIEW_LENGTH = 12;

type SpinPhase = "idle" | "spinning" | "result";

interface MovieRouletteProps {
  movies: MovieCardData[];
  /** Called when the user accepts the pick. Omit to hide the action. */
  onMarkWatched?: (movie: MovieCardData) => void;
  /** Disables the accept action while the parent is saving. */
  marking?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MovieRoulette({ movies, onMarkWatched, marking = false }: MovieRouletteProps) {
  const [phase, setPhase] = useState<SpinPhase>("idle");
  const [plan, setPlan] = useState<ReelPlan<MovieCardData> | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Duration of the in-flight spin, set at roll time from the audio length. */
  const spinDurationRef = useRef(REEL_SPIN_DURATION_MS);

  /** Build the audio element up front so its duration is known by the first roll. */
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(SOUND_SRC);
      audio.volume = SOUND_VOLUME;
      audio.preload = "metadata";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    getAudio();
  }, [getAudio]);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  // Idle strip so the chamber is never empty before the first roll.
  const previewStrip = useMemo(
    () =>
      movies.length === 0
        ? []
        : Array.from({ length: PREVIEW_LENGTH }, (_, i) => movies[i % movies.length]),
    [movies],
  );

  const strip = plan?.strip ?? previewStrip;

  const roll = useCallback(() => {
    if (movies.length === 0) return;

    const nextPlan = buildReelPlan(movies);
    setPlan(nextPlan);

    stopAudio();
    const audio = getAudio();

    // The reel must stop exactly when the sound ends, so the spin is timed to
    // the real audio length; the constant only covers metadata not being ready.
    spinDurationRef.current = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration * 1000
      : REEL_SPIN_DURATION_MS;

    // Autoplay can still be blocked (muted tab, iOS silent switch) — the spin
    // must not depend on the sound, so failures are ignored.
    void audio.play().catch(() => {});

    setPhase(prefersReducedMotion() ? "result" : "spinning");
  }, [movies, stopAudio, getAudio]);

  // Drive the spin imperatively: the strip must be repainted at the start
  // position before the transition to the landing position is attached.
  useEffect(() => {
    const node = stripRef.current;
    if (!node || !plan) return;

    if (phase === "result") {
      node.style.transition = "none";
      node.style.transform = `translate3d(${-plan.offsetPx}px, 0, 0)`;
      return;
    }

    if (phase !== "spinning") return;

    node.style.transition = "none";
    node.style.transform = `translate3d(${-REEL_START_OFFSET}px, 0, 0)`;
    node.getBoundingClientRect(); // force reflow so the start position is committed

    const durationMs = spinDurationRef.current;
    node.style.transition = `transform ${durationMs}ms ${SPIN_EASING}`;
    node.style.transform = `translate3d(${-plan.offsetPx}px, 0, 0)`;

    // Timer rather than transitionend: a backgrounded tab can drop the event.
    settleTimerRef.current = setTimeout(() => setPhase("result"), durationMs);
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [phase, plan]);

  useEffect(() => stopAudio, [stopAudio]);

  const winner = phase === "result" ? plan?.winner : undefined;
  const spinning = phase === "spinning";

  return (
    <div className="space-y-6">
      {/* Reel chamber — its own dark surface in both themes, like a physical machine */}
      <div
        className="relative overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-white/10"
        style={{ height: REEL_ITEM_WIDTH * 1.5 + 56 }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, rgba(251,191,36,0.12), transparent 62%)",
          }}
        />

        <div
          ref={stripRef}
          className="absolute top-7 left-1/2 flex will-change-transform"
          style={{
            gap: REEL_ITEM_GAP,
            transform: `translate3d(${-REEL_START_OFFSET}px, 0, 0)`,
          }}
        >
          {strip.map((movie, index) => (
            <ReelCard
              key={`${movie.id}-${index}`}
              movie={movie}
              isWinner={phase === "result" && plan != null && index === REEL_WINNER_SLOT}
              dimmed={phase === "result" && plan != null && index !== REEL_WINNER_SLOT}
            />
          ))}
        </div>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent" />

        {/* Centre marker */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2">
          <div className="h-full w-0.5 bg-amber-400 shadow-[0_0_14px_2px_rgba(251,191,36,0.65)]" />
          <div className="absolute -top-px left-1/2 -translate-x-1/2 border-x-6 border-t-8 border-x-transparent border-t-amber-400" />
          <div className="absolute -bottom-px left-1/2 -translate-x-1/2 border-x-6 border-b-8 border-x-transparent border-b-amber-400" />
        </div>
      </div>

      {/* Result + controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-h-16 min-w-0">
          {winner ? (
            <>
              <p className="text-xs font-medium uppercase tracking-widest text-amber-500">
                You&apos;re watching
              </p>
              <p className="mt-1 truncate text-2xl font-bold">{winner.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{winner.releaseYear ?? "—"}</span>
                <span>·</span>
                <span>{winner.mediaType === "tv" ? "TV show" : "Movie"}</span>
                {winner.rating != null && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    <Star className="mr-0.5 h-3 w-3 fill-current text-amber-400" />
                    {winner.rating}
                  </Badge>
                )}
                {winner.genres?.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="px-1.5 py-0 text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {spinning ? "Rolling…" : "Hit roll and let the reel decide."}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {winner && onMarkWatched && (
            <Button variant="outline" disabled={marking} onClick={() => onMarkWatched(winner)}>
              {marking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark as watched
            </Button>
          )}
          <Button size="lg" onClick={roll} disabled={spinning || movies.length === 0}>
            {spinning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rolling…
              </>
            ) : winner ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Roll again
              </>
            ) : (
              <>
                <Dices className="mr-2 h-4 w-4" />
                Roll
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReelCardProps {
  movie: MovieCardData;
  isWinner: boolean;
  dimmed: boolean;
}

function ReelCard({ movie, isWinner, dimmed }: ReelCardProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md bg-zinc-900 ring-1 transition-all duration-300 ${
        isWinner
          ? "ring-2 ring-amber-400 shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]"
          : "ring-white/10"
      } ${dimmed ? "opacity-35 saturate-50" : ""}`}
      style={{ width: REEL_ITEM_WIDTH }}
    >
      <div className="relative" style={{ height: REEL_ITEM_WIDTH * 1.5 }}>
        <Image
          src={movie.posterUrl ?? "/placeholder-poster.svg"}
          alt=""
          fill
          sizes={`${REEL_ITEM_WIDTH}px`}
          className="object-cover"
          loading="eager"
          unoptimized
        />
      </div>
      <p className="truncate px-2 py-1.5 text-[11px] font-medium text-zinc-300">{movie.title}</p>
    </div>
  );
}
