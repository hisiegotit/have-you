"use client";

import { useMemo, useState } from "react";
import { MovieGrid } from "@/components/movie-grid";
import type { MovieCardData } from "@/components/movie-card";

interface SharedPageClientProps {
  movies: MovieCardData[];
  userName: string;
}

export function SharedPageClient({ movies, userName }: SharedPageClientProps) {
  const [genreFilter, setGenreFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  const allYears = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => { if (m.releaseYear) set.add(m.releaseYear); });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [movies]);

  const filtered = useMemo(() => {
    let result = movies;
    if (genreFilter !== "all") result = result.filter((m) => m.genres?.includes(genreFilter));
    if (yearFilter !== "all") result = result.filter((m) => m.releaseYear === yearFilter);
    return result;
  }, [movies, genreFilter, yearFilter]);

  const selectClass = "text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{userName}&apos;s Watched Movies</h1>
        <p className="text-muted-foreground mt-1">
          {filtered.length}{filtered.length !== movies.length ? ` of ${movies.length}` : ""} movie{movies.length !== 1 ? "s" : ""} watched
        </p>
      </div>

      {(allGenres.length > 0 || allYears.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {allGenres.length > 0 && (
            <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={selectClass}>
              <option value="all">All genres</option>
              {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          {allYears.length > 0 && (
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClass}>
              <option value="all">All years</option>
              {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      )}

      <MovieGrid
        movies={filtered}
        watchedIds={new Set(movies.map((m) => String(m.id)))}
        showWatchButton={false}
        emptyMessage="No movies match your filters."
      />
    </div>
  );
}
