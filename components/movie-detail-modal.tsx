"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MovieCardData } from "@/components/movie-card";
import type { CastMember } from "@/lib/tmdb-client";

interface MovieDetailModalProps {
  movie: MovieCardData | null;
  onClose: () => void;
  onSaveNote?: (movieId: string, note: string) => Promise<void>;
}

/** Circular placeholder for cast members without a photo */
function CastPhotoPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground shrink-0">
      {name.charAt(0)}
    </div>
  );
}

/** Skeleton row for cast members while loading */
function CastSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3 bg-muted rounded w-3/5" />
        <div className="h-3 bg-muted rounded w-2/5" />
      </div>
    </div>
  );
}

export function MovieDetailModal({ movie, onClose, onSaveNote }: MovieDetailModalProps) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!movie) return;
    setCast([]);
    setNote(movie.note ?? "");
    setLoading(true);

    const type = movie.mediaType ?? "movie";
    fetch(`/api/movies/${movie.id}/credits?type=${type}`)
      .then((r) => r.json())
      .then((data) => setCast(data.cast ?? []))
      .catch(() => toast.error("Could not load cast"))
      .finally(() => setLoading(false));
  }, [movie]);

  function handleNoteChange(value: string) {
    setNote(value);
    if (!onSaveNote || !movie) return;
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(async () => {
      setNoteSaving(true);
      try {
        await onSaveNote(String(movie.id), value);
      } finally {
        setNoteSaving(false);
      }
    }, 800);
  }

  return (
    <Dialog open={movie !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {movie && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold leading-tight pr-6">
                {movie.title}
              </DialogTitle>
            </DialogHeader>

            {/* Top: poster + metadata */}
            <div className="flex gap-4 mt-1">
              {/* Poster */}
              <div className="relative w-28 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-muted">
                <Image
                  src={movie.posterUrl ?? "/placeholder-poster.svg"}
                  alt={movie.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              {/* Metadata */}
              <div className="flex flex-col gap-2 text-sm">
                {movie.releaseYear && (
                  <span className="text-muted-foreground">{movie.releaseYear}</span>
                )}

                {/* TMDB rating */}
                {movie.rating != null && (
                  <span className="text-muted-foreground">
                    TMDB: <span className="font-medium text-foreground">★ {movie.rating}</span>
                  </span>
                )}

                {/* Personal star rating (display only in modal) */}
                {movie.userRating != null && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 text-amber-400"
                        fill={star <= (movie.userRating ?? 0) ? "currentColor" : "none"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.rating != null && (
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-4 mt-1">
                    {/* overview not on MovieCardData — shown via cast section below */}
                  </p>
                )}
              </div>
            </div>

            {/* Personal note — only shown when onSaveNote is provided (i.e. watched movie from dashboard) */}
            {onSaveNote && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-semibold">My note</h3>
                  {noteSaving && <span className="text-xs text-muted-foreground">Saving…</span>}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Add a personal note about this movie…"
                  rows={3}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            )}

            {/* Cast */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-3">Cast</h3>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => <CastSkeleton key={i} />)}
                </div>
              ) : cast.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cast information available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cast.map((member, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {member.profileUrl ? (
                        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={member.profileUrl}
                            alt={member.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <CastPhotoPlaceholder name={member.name} />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{member.name}</span>
                        {member.character && (
                          <span className="text-xs text-muted-foreground truncate">
                            {member.character}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
