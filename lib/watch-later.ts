import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb-client";
import type { MovieCardData } from "@/components/movie-card";

/** Loads a user's Watch Later list, newest first, shaped for the movie card components. */
export async function getWatchLaterMovies(userId: string): Promise<MovieCardData[]> {
  const rows = await prisma.watchLaterMovie.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.movieId,
    title: row.movieTitle,
    posterUrl: posterUrl(row.posterPath ?? null),
    posterPath: row.posterPath ?? null,
    releaseYear: row.releaseYear ?? null,
    rating: row.voteAverage ?? undefined,
    mediaType: (row.mediaType === "tv" ? "tv" : "movie") as "movie" | "tv",
    genres: row.genres ?? [],
  }));
}
