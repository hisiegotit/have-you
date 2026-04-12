"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Film, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { MovieGrid } from "@/components/movie-grid";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import type { MovieCardData } from "@/components/movie-card";

type SortBy = "date-desc" | "date-asc" | "rating" | "title-az";
type FilterMediaType = "all" | "movie" | "tv";
type ActiveTab = "watched" | "watch-later";

interface DashboardClientProps {
  initialMovies: MovieCardData[];
  initialWatchLater: MovieCardData[];
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

export function DashboardClient({ initialMovies, initialWatchLater }: DashboardClientProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [watchLater, setWatchLater] = useState(initialWatchLater);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [mediaFilter, setMediaFilter] = useState<FilterMediaType>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [selectedMovie, setSelectedMovie] = useState<MovieCardData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("watched");
  const [displayCount, setDisplayCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset display count when filters/sort change
  useEffect(() => { setDisplayCount(24); }, [searchQuery, sortBy, mediaFilter, genreFilter, activeTab]);

  const filtered = useMemo(() => {
    let result = movies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (mediaFilter !== "all") result = result.filter((m) => (m.mediaType ?? "movie") === mediaFilter);
    if (genreFilter !== "all") result = result.filter((m) => m.genres?.includes(genreFilter));
    return result;
  }, [movies, searchQuery, mediaFilter, genreFilter]);

  const sortedMovies = useMemo(() => sortMovies(filtered, sortBy), [filtered, sortBy]);
  const visibleMovies = sortedMovies.slice(0, displayCount);
  const hasMore = displayCount < sortedMovies.length;

  // Infinite scroll — reveal 24 more when sentinel enters viewport.
  // Depends on displayCount so the observer is re-created after each batch;
  // this catches the case where the sentinel never leaves the viewport
  // (too few remaining items to push it out), which would otherwise prevent
  // the last 1-2 movies from loading.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setDisplayCount((c) => c + 24);
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, displayCount]);

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

  async function handleSaveNote(movieId: string, note: string) {
    setMovies((prev) =>
      prev.map((m) => (String(m.id) === movieId ? { ...m, note } : m))
    );
    const res = await fetch("/api/movies/watched", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, note }),
    });
    if (!res.ok) throw new Error("Failed to save note");
  }

  async function handleRemoveWatchLater(movie: MovieCardData) {
    const id = String(movie.id);
    // Optimistic
    setWatchLater((prev) => prev.filter((m) => String(m.id) !== id));
    try {
      const res = await fetch(`/api/movies/watch-later?movieId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success(`Removed "${movie.title}" from Watch Later`);
    } catch {
      setWatchLater((prev) => [...prev, movie]);
      toast.error("Failed to remove from Watch Later");
    }
  }

  async function handleMarkAsWatched(movie: MovieCardData) {
    const id = String(movie.id);
    const now = new Date().toISOString();
    // Optimistic: add to watched, remove from watch-later
    setMovies((prev) => [{ ...movie, watchedAt: now }, ...prev]);
    setWatchLater((prev) => prev.filter((m) => String(m.id) !== id));
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
      if (!watchRes.ok || !removeRes.ok) throw new Error("Failed");
      toast.success(`Marked "${movie.title}" as watched`);
    } catch {
      // Roll back
      setMovies((prev) => prev.filter((m) => String(m.id) !== id));
      setWatchLater((prev) => [movie, ...prev]);
      toast.error("Failed to mark as watched");
    }
  }

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  const watchedIds = new Set(movies.map((m) => String(m.id)));

  if (movies.length === 0 && watchLater.length === 0) {
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
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onSaveNote={selectedMovie && watchedIds.has(String(selectedMovie.id)) ? handleSaveNote : undefined}
      />
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button onClick={() => setActiveTab("watched")} className={mediaToggleClass(activeTab === "watched")}>
            Watched <span className="ml-1 text-xs text-muted-foreground">({movies.length})</span>
          </button>
          <button onClick={() => setActiveTab("watch-later")} className={mediaToggleClass(activeTab === "watch-later")}>
            <Bookmark className="inline h-3.5 w-3.5 mr-1" />
            Watch Later <span className="ml-1 text-xs text-muted-foreground">({watchLater.length})</span>
          </button>
        </div>

        {activeTab === "watch-later" ? (
          watchLater.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <Bookmark className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No movies saved for later</p>
              <Link href="/search" className="text-sm underline text-muted-foreground hover:text-foreground">
                Browse movies
              </Link>
            </div>
          ) : (
            <MovieGrid
              movies={watchLater}
              watchedIds={watchedIds}
              onToggleWatch={handleMarkAsWatched}
              onMovieClick={setSelectedMovie}
              emptyMessage="Nothing saved yet"
            />
          )
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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

              <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                {(["all", "movie", "tv"] as FilterMediaType[]).map((t) => (
                  <button key={t} onClick={() => setMediaFilter(t)} className={mediaToggleClass(mediaFilter === t)}>
                    {t === "all" ? "All" : t === "movie" ? "Movies" : "TV Shows"}
                  </button>
                ))}
              </div>
            </div>

            {sortedMovies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No movies match your filters</p>
            ) : (
              <>
                <MovieGrid
                  movies={visibleMovies}
                  emptyMessage="No movies match your filters"
                  {...gridProps}
                />
                <div ref={sentinelRef} className="flex justify-center py-6">
                  {hasMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
