import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Search } from "lucide-react";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb-client";
import { decryptNote } from "@/lib/note-encryption";
import { DashboardClient } from "@/components/dashboard-client";
import { ErrorBoundary } from "@/components/error-boundary";
import { ShareButton } from "@/components/share-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Have You" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [watched, watchLaterRows] = await Promise.all([
    prisma.watchedMovie.findMany({
      where: { userId: session.user.id },
      orderBy: { watchedAt: "desc" },
    }),
    prisma.watchLaterMovie.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    }),
  ]);

  const movies = watched.map((m) => ({
    id: m.movieId,
    title: m.movieTitle,
    posterUrl: posterUrl(m.posterPath ?? null),
    posterPath: m.posterPath ?? null,
    releaseYear: m.releaseYear ?? null,
    rating: m.voteAverage ?? undefined,
    watchedAt: m.watchedAt.toISOString(),
    userRating: m.userRating ?? undefined,
    note: m.note ? (decryptNote(m.note) ?? undefined) : undefined,
    mediaType: (m.mediaType === "tv" ? "tv" : "movie") as "movie" | "tv",
    genres: m.genres ?? [],
  }));

  const watchLaterMovies = watchLaterRows.map((m) => ({
    id: m.movieId,
    title: m.movieTitle,
    posterUrl: posterUrl(m.posterPath ?? null),
    posterPath: m.posterPath ?? null,
    releaseYear: m.releaseYear ?? null,
    rating: m.voteAverage ?? undefined,
    mediaType: (m.mediaType === "tv" ? "tv" : "movie") as "movie" | "tv",
    genres: m.genres ?? [],
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {movies.length} watched · {watchLaterMovies.length} saved for later
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareButton />
<Link href="/search" className={cn(buttonVariants({ size: "sm" }))}>
            <Search className="h-4 w-4 mr-2" />
            Search Movies
          </Link>
        </div>
      </div>

      {/* Watched movies grid */}
      <ErrorBoundary>
        <DashboardClient initialMovies={movies} initialWatchLater={watchLaterMovies} />
      </ErrorBoundary>
    </div>
  );
}
