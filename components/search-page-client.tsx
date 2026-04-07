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
type SearchType = "title" | "actor";

// Fix
export function SearchPageClient() {
  const [movies, setMovies] = useState<MovieCardData[]>([]);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [watchLaterIds, setWatchLaterIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [selectedMovie, setSelectedMovie] = useState<MovieCardData | null>(null);

  // Load initial watch-later ids
  useEffect(() => {
    fetch("/api/movies/watch-later")
      .then((r) => r.json())
      .then((data) => {
        if (data.movies) setWatchLaterIds(new Set(data.movies.map((m: { movieId: string }) => m.movieId)));
      })
      .catch(() => {});
  }, []);

  const fetchContent = useCallback(async (q: string, pg: number, type: MediaType, sType: SearchType, append = false) => {
    if (append) setLoadingMore(true); else setSearching(true);
    try {
      const params = q.length >= 2
        ? `?q=${encodeURIComponent(q)}&page=${pg}&type=${type}&searchType=${sType}`
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

  useEffect(() => { fetchContent("", 1, "movie", "title"); }, [fetchContent]);

  function handleTypeChange(type: MediaType) {
    setMediaType(type);
    setQuery("");
    setPage(1);
    fetchContent("", 1, type, searchType);
  }

  function handleSearchTypeChange(sType: SearchType) {
    setSearchType(sType);
    setPage(1);
    if (query.length >= 2) fetchContent(query, 1, mediaType, sType);
  }

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
    fetchContent(q, 1, mediaType, searchType);
  }, [fetchContent, mediaType, searchType]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchContent(query, next, mediaType, searchType, true);
  }

  async function handleToggleWatch(movie: MovieCardData) {
    const id = String(movie.id);
    const wasWatched = watchedIds.has(id);

    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (wasWatched) next.delete(id); else next.add(id);
      return next;
    });

    // Marking as watched removes it from watch-later
    const wasWatchLater = !wasWatched && watchLaterIds.has(id);
    if (wasWatchLater) {
      setWatchLaterIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }

    try {
      if (wasWatched) {
        const res = await fetch(`/api/movies/watched?movieId=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to unwatch");
        toast.success(`Removed "${movie.title}" from watched`);
      } else {
        const [watchRes] = await Promise.all([
          fetch("/api/movies/watched", {
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
          }),
          // Remove from watch-later if it was there
          wasWatchLater
            ? fetch(`/api/movies/watch-later?movieId=${id}`, { method: "DELETE" })
            : Promise.resolve(new Response()),
        ]);
        if (!watchRes.ok) throw new Error("Failed to mark watched");
        toast.success(`Added "${movie.title}" to watched`);
      }
    } catch (err) {
      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (wasWatched) next.add(id); else next.delete(id);
        return next;
      });
      if (wasWatchLater) {
        setWatchLaterIds((prev) => { const next = new Set(prev); next.add(id); return next; });
      }
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function handleToggleWatchLater(movie: MovieCardData) {
    const id = String(movie.id);
    const wasLater = watchLaterIds.has(id);

    setWatchLaterIds((prev) => {
      const next = new Set(prev);
      if (wasLater) next.delete(id); else next.add(id);
      return next;
    });

    // Cannot watch-later something already watched
    if (!wasLater && watchedIds.has(id)) return;

    try {
      if (wasLater) {
        const res = await fetch(`/api/movies/watch-later?movieId=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove");
        toast.success(`Removed "${movie.title}" from Watch Later`);
      } else {
        const res = await fetch("/api/movies/watch-later", {
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
        if (!res.ok) throw new Error("Failed to save");
        toast.success(`Saved "${movie.title}" to Watch Later`);
      }
    } catch (err) {
      setWatchLaterIds((prev) => {
        const next = new Set(prev);
        if (wasLater) next.add(id); else next.delete(id);
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  const heading = query.length >= 2
    ? searchType === "actor"
      ? `Movies with "${query}"`
      : `Results for "${query}"`
    : mediaType === "tv" ? "Trending TV Shows" : "Trending This Week";

  const toggleClass = (active: boolean) =>
    `px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <>
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
      <div className="space-y-6">
        {/* Controls row */}
        <div className="flex flex-wrap gap-2">
          {/* Media type */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button onClick={() => handleTypeChange("movie")} className={toggleClass(mediaType === "movie")}>Movies</button>
            <button onClick={() => handleTypeChange("tv")} className={toggleClass(mediaType === "tv")}>TV Shows</button>
          </div>
          {/* Search type */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button onClick={() => handleSearchTypeChange("title")} className={toggleClass(searchType === "title")}>By Title</button>
            <button onClick={() => handleSearchTypeChange("actor")} className={toggleClass(searchType === "actor")}>By Actor</button>
          </div>
        </div>

        <SearchBar
          onSearch={handleSearch}
          placeholder={searchType === "actor" ? "Search by actor name…" : "Search movies…"}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{heading}</h2>
          {searching && <span className="text-sm text-muted-foreground">Searching…</span>}
        </div>

        <MovieGrid
          movies={movies}
          watchedIds={watchedIds}
          watchLaterIds={watchLaterIds}
          onToggleWatch={handleToggleWatch}
          onToggleWatchLater={handleToggleWatchLater}
          onMovieClick={(m) => setSelectedMovie({ ...m, mediaType })}
          emptyMessage={searching ? "Searching…" : "No results found."}
        />

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
