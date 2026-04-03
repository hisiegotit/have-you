import { MovieCard, MovieCardData } from "@/components/movie-card";
import { MovieCardSkeleton } from "@/components/movie-card-skeleton";

interface MovieGridProps {
  movies: MovieCardData[];
  watchedIds?: Set<string>;
  showWatchButton?: boolean;
  onToggleWatch?: (movie: MovieCardData) => void;
  onRatingChange?: (movie: MovieCardData, rating: number | null) => void;
  onMovieClick?: (movie: MovieCardData) => void;
  loadingId?: string | null;
  emptyMessage?: string;
  loading?: boolean;
}

export function MovieGrid({
  movies,
  watchedIds = new Set(),
  showWatchButton = true,
  onToggleWatch,
  onRatingChange,
  onMovieClick,
  loadingId,
  emptyMessage = "No movies found.",
  loading,
}: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isWatched={watchedIds.has(String(movie.id))}
          showWatchButton={showWatchButton}
          onToggleWatch={onToggleWatch}
          onRatingChange={onRatingChange}
          onClick={onMovieClick}
          loading={loadingId === String(movie.id)}
        />
      ))}
    </div>
  );
}
