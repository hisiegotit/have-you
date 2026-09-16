"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { MovieRoulette } from "@/components/movie-roulette";
import type { MovieCardData } from "@/components/movie-card";

interface RoulettePageClientProps {
  initialMovies: MovieCardData[];
}

export function RoulettePageClient({ initialMovies }: RoulettePageClientProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [marking, setMarking] = useState(false);

  /** Moves the pick into Watched and drops it from the draw. */
  async function handleMarkWatched(movie: MovieCardData) {
    const id = String(movie.id);
    setMarking(true);
    try {
      const [watchRes, removeRes] = await Promise.all([
        fetch("/api/movies/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: id,
            movieTitle: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            voteAverage: movie.rating,
            mediaType: movie.mediaType,
            genres: movie.genres,
          }),
        }),
        fetch(`/api/movies/watch-later?movieId=${id}`, { method: "DELETE" }),
      ]);
      if (!watchRes.ok || !removeRes.ok) throw new Error("Failed to mark as watched");

      setMovies((prev) => prev.filter((m) => String(m.id) !== id));
      toast.success(`Marked "${movie.title}" as watched`);
    } catch {
      toast.error("Failed to mark as watched");
    } finally {
      setMarking(false);
    }
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Bookmark className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Nothing to roll for</p>
        <p className="text-sm text-muted-foreground">
          Save a few titles to Watch Later and the reel has something to pick from.
        </p>
        <Link
          href="/search"
          className="mt-1 text-sm underline text-muted-foreground hover:text-foreground"
        >
          Browse movies
        </Link>
      </div>
    );
  }

  return <MovieRoulette movies={movies} onMarkWatched={handleMarkWatched} marking={marking} />;
}
