"use client";

import Image from "next/image";
import { Bookmark, Check, MessageSquare, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MovieCardData {
  id: number | string;
  title: string;
  posterUrl: string | null;
  posterPath: string | null;
  releaseYear: string | null;
  rating?: number;
  watchedAt?: string;
  userRating?: number;   // 1-5 personal star rating
  note?: string;         // personal note (watched movies only)
  mediaType?: "movie" | "tv";
  genres?: string[];     // genre names from TMDB
}

interface MovieCardProps {
  movie: MovieCardData;
  isWatched: boolean;
  isWatchLater?: boolean;
  showWatchButton?: boolean;
  onToggleWatch?: (movie: MovieCardData) => void;
  onToggleWatchLater?: (movie: MovieCardData) => void;
  onRatingChange?: (movie: MovieCardData, rating: number | null) => void;
  onClick?: (movie: MovieCardData) => void;
  loading?: boolean;
  priority?: boolean;
}

export function MovieCard({ movie, isWatched, isWatchLater = false, showWatchButton = true, onToggleWatch, onToggleWatchLater, onRatingChange, onClick, loading, priority = false }: MovieCardProps) {
  return (
    <div
      className={`group relative flex flex-col rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick ? () => onClick(movie) : undefined}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-muted">
        <Image
          src={movie.posterUrl ?? "/placeholder-poster.svg"}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
          priority={priority}
          unoptimized
        />
        {isWatched && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <p className="text-sm font-medium leading-tight line-clamp-2">{movie.title}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-muted-foreground">{movie.releaseYear ?? "—"}</span>
          <div className="flex items-center gap-1.5">
            {movie.note?.trim() && (
              <div className="relative group/note">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" fill="currentColor" strokeWidth={1.5} />
                <div className="absolute bottom-full right-0 mb-1.5 w-max max-w-[160px] rounded bg-popover border px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 pointer-events-none group-hover/note:opacity-100 transition-opacity z-10">
                  You left a note on this movie
                </div>
              </div>
            )}
            {movie.rating != null && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                ★ {movie.rating}
              </Badge>
            )}
          </div>
        </div>
        {/* Personal star rating — only shown on watched cards when callback provided */}
        {isWatched && onRatingChange && (
          <div className="flex items-center gap-0.5 mt-1" onClick={(e) => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                onClick={() => onRatingChange(movie, movie.userRating === star ? null : star)}
                className="text-amber-400 hover:scale-110 transition-transform"
              >
                <Star
                  className="h-4 w-4"
                  fill={movie.userRating != null && star <= movie.userRating ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        )}
        {(showWatchButton && onToggleWatch) || onToggleWatchLater ? (
          <div className="flex gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            {showWatchButton && onToggleWatch && (
              <Button
                size="sm"
                variant={isWatched ? "outline" : "default"}
                className="flex-1"
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); onToggleWatch(movie); }}
              >
                {isWatched ? <><X className="h-3 w-3 mr-1" />Unwatch</> : <><Plus className="h-3 w-3 mr-1" />Watch</>}
              </Button>
            )}
            {onToggleWatchLater && !isWatched && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onToggleWatchLater(movie); }}
                aria-label={isWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
                className={isWatchLater ? "text-amber-400 hover:text-amber-500" : ""}
                title={isWatchLater ? "Remove from Watch Later" : "Save for later"}
              >
                {isWatchLater
                  ? <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                  : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        ) : null}
        {movie.watchedAt && (
          <p className="text-xs text-muted-foreground text-center">
            {new Date(movie.watchedAt).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>
    </div>
  );
}
