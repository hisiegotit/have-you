"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/search-bar";
import { MovieGrid } from "@/components/movie-grid";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import { Button } from "@/components/ui/button";
import type { MovieCardData } from "@/components/movie-card";

type MediaType = "movie" | "tv";
// Fix
export function SearchPageClient() {
  const [movies, setMovies] = useState<MovieCardData[]>([]);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedMovie, setSelectedMovie] = useState<MovieCardData | null>(null);

  const fetchContent = useCallback(async (q: string, pg: number, type: MediaType, append = false) => {
    if (append) setLoadingMore(true); else setSearching(true);
    try {
      const params = q.length >= 2
        ? `?q=${encodeURIComponent(q)}&page=${pg}&type=${type}`
        : `?trending=true&page=${pg}&type=${type}`;
      const res = await fetch(`/api/movies/search${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setTotalPages(data.totalPages ?? 1);

      const results: (MovieCardData & { isWatched?: boolean })[] = data.results;
      setWatchedIds((prev) => {
        const next = append ? new Set(prev) : new Set<string>();
        results.forEach((m) => { if (m.isWatched) next.add(String(m.id)); });
        return next;
      });
      setMovies((prev) => {
        if (!append) return results;
        const existingIds = new Set(prev.map((m) => String(m.id)));
        return [...prev, ...results.filter((m) => !existingIds.has(String(m.id)))];
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      if (append) setLoadingMore(false); else setSearching(false);
    }
  }, []);

  useEffect(() => { fetchContent("", 1, "movie"); }, [fetchContent]);

  function handleTypeChange(type: MediaType) {
    setMediaType(type);
    setQuery("");
    setPage(1);
    fetchContent("", 1, type);
  }

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
    fetchContent(q, 1, mediaType);
  }, [fetchContent, mediaType]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchContent(query, next, mediaType, true);
  }

  async function handleToggleWatch(movie: MovieCardData) {
    const id = String(movie.id);
    const wasWatched = watchedIds.has(id);

    // Optimistic update — flip immediately
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (wasWatched) next.delete(id); else next.add(id);
      return next;
    });

    try {
      if (wasWatched) {
        const res = await fetch(`/api/movies/watched?movieId=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to unwatch");
        toast.success(`Removed "${movie.title}" from watched`);
      } else {
        const res = await fetch("/api/movies/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: id,
            movieTitle: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            voteAverage: movie.rating,
            mediaType,
            genres: movie.genres ?? [],
          }),
        });
        if (!res.ok) throw new Error("Failed to mark watched");
        toast.success(`Added "${movie.title}" to watched`);
      }
    } catch (err) {
      // Rollback on failure
      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (wasWatched) next.add(id); else next.delete(id);
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  const heading = query.length >= 2
    ? `Results for "${query}"`
    : mediaType === "tv" ? "Trending TV Shows" : "Trending This Week";

  return (
    <>
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
      <div className="space-y-6">
        {/* Media type toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => handleTypeChange("movie")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mediaType === "movie"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => handleTypeChange("tv")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mediaType === "tv"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            TV Shows
          </button>
        </div>

        <SearchBar onSearch={handleSearch} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{heading}</h2>
          {searching && <span className="text-sm text-muted-foreground">Searching…</span>}
        </div>

        <MovieGrid
          movies={movies}
          watchedIds={watchedIds}
          onToggleWatch={handleToggleWatch}
          onMovieClick={(m) => setSelectedMovie({ ...m, mediaType })}
          emptyMessage={searching ? "Searching…" : "No results found."}
        />

        {/* Load more */}
        {!searching && page < totalPages && (
          <div className="flex justify-center pt-4">
            {loadingMore ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Button variant="outline" onClick={handleLoadMore}>Load more</Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
