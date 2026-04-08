"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/search-bar";
import { MovieGrid } from "@/components/movie-grid";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import { ActorCard, type ActorCardData } from "@/components/actor-card";
import { Button } from "@/components/ui/button";
import type { MovieCardData } from "@/components/movie-card";

type MediaType = "all" | "movie" | "tv";
type SearchMode = "title" | "actor";

export function SearchPageClient() {
  // ── Title search state ──────────────────────────────────────────────────────
  const [allResults, setAllResults] = useState<MovieCardData[]>([]);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [watchLaterIds, setWatchLaterIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MediaType>("all");

  // ── Actor search state ──────────────────────────────────────────────────────
  const [actors, setActors] = useState<ActorCardData[]>([]);
  const [selectedActor, setSelectedActor] = useState<ActorCardData | null>(null);
  const [actorMovies, setActorMovies] = useState<MovieCardData[]>([]);
  const [loadingActors, setLoadingActors] = useState(false);
  const [loadingActorMovies, setLoadingActorMovies] = useState(false);

  // ── Shared state ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [selectedMovie, setSelectedMovie] = useState<MovieCardData | null>(null);

  // Client-side type filter applied to title search results
  const movies = typeFilter === "all"
    ? allResults
    : allResults.filter((m) => m.mediaType === typeFilter);

  // ── Watch-later ids on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/movies/watch-later")
      .then((r) => r.json())
      .then((data) => {
        if (data.movies) setWatchLaterIds(new Set(data.movies.map((m: { movieId: string }) => m.movieId)));
      })
      .catch(() => {});
  }, []);

  // ── Title / trending fetch ──────────────────────────────────────────────────
  const fetchTitles = useCallback(async (q: string, pg: number, type: MediaType, append = false) => {
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
      setAllResults((prev) => {
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

  useEffect(() => { fetchTitles("", 1, "all"); }, [fetchTitles]);

  // ── Actor name search ───────────────────────────────────────────────────────
  const fetchActors = useCallback(async (q: string) => {
    if (q.length < 2) { setActors([]); return; }
    setLoadingActors(true);
    try {
      const res = await fetch(`/api/movies/search?people=true&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setActors(data.results ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoadingActors(false);
    }
  }, []);

  // ── Load actor's filmography ────────────────────────────────────────────────
  async function handleActorClick(actor: ActorCardData) {
    setSelectedActor(actor);
    setActorMovies([]);
    setLoadingActorMovies(true);
    try {
      const res = await fetch(`/api/movies/person/${actor.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load filmography");

      const results: (MovieCardData & { isWatched?: boolean })[] = data.results;
      setWatchedIds((prev) => {
        const next = new Set(prev);
        results.forEach((m) => { if (m.isWatched) next.add(String(m.id)); });
        return next;
      });
      setActorMovies(results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load filmography");
    } finally {
      setLoadingActorMovies(false);
    }
  }

  // ── Mode switch ─────────────────────────────────────────────────────────────
  function switchMode(mode: SearchMode) {
    setSearchMode(mode);
    setQuery("");
    setSelectedActor(null);
    setActors([]);
    if (mode === "title") fetchTitles("", 1, "all");
  }

  // ── Title search handler ────────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (searchMode === "actor") {
      setSelectedActor(null);
      fetchActors(q);
    } else {
      setPage(1);
      fetchTitles(q, 1, "all");
    }
  }, [fetchTitles, fetchActors, searchMode]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchTitles(query, next, "all", true);
  }

  // ── Watch / watch-later handlers (shared) ───────────────────────────────────
  async function handleToggleWatch(movie: MovieCardData) {
    const id = String(movie.id);
    const wasWatched = watchedIds.has(id);

    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (wasWatched) next.delete(id); else next.add(id);
      return next;
    });

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
              mediaType: movie.mediaType ?? "movie",
              genres: movie.genres ?? [],
            }),
          }),
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
            mediaType: movie.mediaType ?? "movie",
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

  const toggleClass = (active: boolean) =>
    `px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  const currentMovies = selectedActor ? actorMovies : movies;
  const isLoading = searchMode === "actor"
    ? (selectedActor ? loadingActorMovies : loadingActors)
    : searching;

  return (
    <>
      <MovieDetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />

      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {searchMode === "title" && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button onClick={() => setTypeFilter("all")} className={toggleClass(typeFilter === "all")}>All</button>
              <button onClick={() => setTypeFilter("movie")} className={toggleClass(typeFilter === "movie")}>Movies</button>
              <button onClick={() => setTypeFilter("tv")} className={toggleClass(typeFilter === "tv")}>TV Shows</button>
            </div>
          )}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button onClick={() => switchMode("title")} className={toggleClass(searchMode === "title")}>By Title</button>
            <button onClick={() => switchMode("actor")} className={toggleClass(searchMode === "actor")}>By Actor</button>
          </div>
        </div>

        {/* Search bar — hidden when viewing an actor's filmography */}
        {!selectedActor && (
          <SearchBar
            onSearch={handleSearch}
            placeholder={searchMode === "actor" ? "Search actor name…" : "Search movies & shows…"}
          />
        )}

        {/* Actor filmography header */}
        {selectedActor && (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedActor(null); setActors([]); }}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-lg font-semibold">{selectedActor.name}</h2>
          </div>
        )}

        {/* Heading for title search */}
        {searchMode === "title" && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {query.length >= 2 ? `Results for "${query}"` : "Trending This Week"}
            </h2>
            {searching && <span className="text-sm text-muted-foreground">Searching…</span>}
          </div>
        )}

        {/* Actor grid */}
        {searchMode === "actor" && !selectedActor && (
          <>
            {loadingActors && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingActors && actors.length === 0 && query.length >= 2 && (
              <p className="text-center text-muted-foreground py-12">No actors found.</p>
            )}
            {!loadingActors && query.length < 2 && (
              <p className="text-center text-muted-foreground py-12">Type an actor&apos;s name to search.</p>
            )}
            {!loadingActors && actors.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {actors.map((actor) => (
                  <ActorCard key={actor.id} actor={actor} onClick={handleActorClick} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Movie grid — title search or actor filmography */}
        {(searchMode === "title" || selectedActor) && (
          <>
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && (
              <MovieGrid
                movies={currentMovies}
                watchedIds={watchedIds}
                watchLaterIds={watchLaterIds}
                onToggleWatch={handleToggleWatch}
                onToggleWatchLater={handleToggleWatchLater}
                onMovieClick={(m) => setSelectedMovie(m)}
                emptyMessage="No results found."
              />
            )}
          </>
        )}

        {/* Load more — title search only */}
        {searchMode === "title" && !searching && page < totalPages && (
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
