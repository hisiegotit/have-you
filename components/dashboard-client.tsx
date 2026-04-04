"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Film, Search } from "lucide-react";
import { toast } from "sonner";
import { MovieGrid } from "@/components/movie-grid";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import type { MovieCardData } from "@/components/movie-card";

type SortBy = "date-desc" | "date-asc" | "rating" | "title-az";
type FilterMediaType = "all" | "movie" | "tv";

interface DashboardClientProps {
  initialMovies: MovieCardData[];
}

function sortMovies(list: MovieCardData[], sortBy: SortBy) {
  return [...list].sort((a, b) => {
    if (sortBy === "date-asc") return (a.watchedAt ?? "") < (b.watchedAt ?? "") ? -1 : 1;
    if (sortBy === "rating") {
      const diff = (b.userRating ?? 0) - (a.userRating ?? 0);
      return diff !== 0 ? diff : (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
    }
    if (sortBy === "title-az") return a.title.localeCompare(b.title);
    return (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
  });
}

export function DashboardClient({ initialMovies }: DashboardClientProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [mediaFilter, setMediaFilter] = useState<FilterMediaType>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
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

  // All unique genres across the collection, sorted alphabetically
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  // Base list after search + media type + genre filters
  const filtered = useMemo(() => {
    let result = movies;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (mediaFilter !== "all") {
      result = result.filter((m) => (m.mediaType ?? "movie") === mediaFilter);
    }
    if (genreFilter !== "all") {
      result = result.filter((m) => m.genres?.includes(genreFilter));
    }

    return result;
  }, [movies, searchQuery, mediaFilter, genreFilter]);

  // When a specific genre is selected → single sorted list
  // When no genre filter → group by primary genre (first genre)
  const sections = useMemo(() => {
    if (genreFilter !== "all") {
      return [{ genre: genreFilter, movies: sortMovies(filtered, sortBy) }];
    }

    // Group by all genres — a movie appears in every genre section it belongs to
    const map = new Map<string, MovieCardData[]>();
    for (const movie of filtered) {
      const genres = movie.genres?.length ? movie.genres : ["Other"];
      for (const genre of genres) {
        if (!map.has(genre)) map.set(genre, []);
        map.get(genre)!.push(movie);
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([genre, list]) => ({ genre, movies: sortMovies(list, sortBy) }));
  }, [filtered, genreFilter, sortBy]);

  const watchedIds = new Set(movies.map((m) => String(m.id)));

  // Empty state
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Film className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold">No movies watched yet</p>
        <p className="text-sm text-muted-foreground">Start building your collection</p>
        <Link href="/search" className="mt-2 text-sm underline text-muted-foreground hover:text-foreground">
          Search Movies
        </Link>
      </div>
    );
  }

  const mediaToggleClass = (active: boolean) =>
    `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
      active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  const gridProps = {
    watchedIds,
    onToggleWatch: handleUnwatch,
    onRatingChange: handleRate,
    onMovieClick: setSelectedMovie,
    loadingId,
  };

  return (
    <>
      <MovieDetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
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

          {/* Genre filter */}
          {allGenres.length > 0 && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          {/* Media type filter */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {(["all", "movie", "tv"] as FilterMediaType[]).map((t) => (
              <button key={t} onClick={() => setMediaFilter(t)} className={mediaToggleClass(mediaFilter === t)}>
                {t === "all" ? "All" : t === "movie" ? "Movies" : "TV Shows"}
              </button>
            ))}
          </div>
        </div>

        {/* Genre sections */}
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No movies match your filters</p>
        ) : (
          sections.map(({ genre, movies: sectionMovies }) => (
            <div key={genre} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{genre}</h2>
                <span className="text-xs text-muted-foreground">({sectionMovies.length})</span>
              </div>
              <MovieGrid
                movies={sectionMovies}
                emptyMessage="No movies match your filters"
                {...gridProps}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
