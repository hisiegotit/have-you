"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Film, Search } from "lucide-react";
import { toast } from "sonner";
import { MovieGrid } from "@/components/movie-grid";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import type { MovieCardData } from "@/components/movie-card";

type SortBy = "date-desc" | "date-asc" | "rating" | "title-az";
type FilterType = "all" | "movie" | "tv";

interface DashboardClientProps {
  initialMovies: MovieCardData[];
}

export function DashboardClient({ initialMovies }: DashboardClientProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedMovie, setSelectedMovie] = useState<MovieCardData | null>(null);

  async function handleUnwatch(movie: MovieCardData) {
    const id = String(movie.id);
    setLoadingId(id);
    try {
      const res = await fetch(`/api/movies/watched?movieId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unwatch");
      setMovies((prev) => prev.filter((m) => String(m.id) !== id));
      toast.success(`Removed "${movie.title}"`);
    } catch {
      toast.error("Failed to remove movie");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRate(movie: MovieCardData, rating: number | null) {
    const id = String(movie.id);
    setMovies((prev) =>
      prev.map((m) => (String(m.id) === id ? { ...m, userRating: rating ?? undefined } : m))
    );
    try {
      const res = await fetch("/api/movies/watched", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: id, userRating: rating }),
      });
      if (!res.ok) throw new Error("Failed to save rating");
    } catch {
      setMovies((prev) =>
        prev.map((m) => (String(m.id) === id ? { ...m, userRating: movie.userRating } : m))
      );
      toast.error("Failed to save rating");
    }
  }

  const filteredMovies = useMemo(() => {
    let result = movies;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (filterType !== "all") {
      result = result.filter((m) => (m.mediaType ?? "movie") === filterType);
    }

    return [...result].sort((a, b) => {
      if (sortBy === "date-asc") return (a.watchedAt ?? "") < (b.watchedAt ?? "") ? -1 : 1;
      if (sortBy === "rating") {
        const diff = (b.userRating ?? 0) - (a.userRating ?? 0);
        return diff !== 0 ? diff : (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
      }
      if (sortBy === "title-az") return a.title.localeCompare(b.title);
      // default: date-desc
      return (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
    });
  }, [movies, searchQuery, sortBy, filterType]);

  const watchedIds = new Set(movies.map((m) => String(m.id)));

  // Empty state: no movies at all
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Film className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold">No movies watched yet</p>
        <p className="text-sm text-muted-foreground">Start building your collection</p>
        <Link
          href="/search"
          className="mt-2 text-sm underline text-muted-foreground hover:text-foreground"
        >
          Search Movies
        </Link>
      </div>
    );
  }

  const typeToggleClass = (active: boolean) =>
    `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
      active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <>
    <MovieDetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="date-desc">Date watched (newest)</option>
          <option value="date-asc">Date watched (oldest)</option>
          <option value="rating">Rating (highest)</option>
          <option value="title-az">Title (A–Z)</option>
        </select>

        {/* Type filter */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {(["all", "movie", "tv"] as FilterType[]).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={typeToggleClass(filterType === t)}>
              {t === "all" ? "All" : t === "movie" ? "Movies" : "TV Shows"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <MovieGrid
        movies={filteredMovies}
        watchedIds={watchedIds}
        onToggleWatch={handleUnwatch}
        onRatingChange={handleRate}
        onMovieClick={setSelectedMovie}
        loadingId={loadingId}
        emptyMessage="No movies match your filters"
      />
    </div>
    </>
  );
}
