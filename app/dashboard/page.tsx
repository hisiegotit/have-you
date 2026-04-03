import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Search } from "lucide-react";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb-client";
import { DashboardClient } from "@/components/dashboard-client";
import { ErrorBoundary } from "@/components/error-boundary";
import { ShareButton } from "@/components/share-button";
import { DownloadPosterButton } from "@/components/download-poster-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Have You" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const watched = await prisma.watchedMovie.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
  });

  const movies = watched.map((m) => ({
    id: m.movieId,
    title: m.movieTitle,
    posterUrl: posterUrl(m.posterPath ?? null),
    posterPath: m.posterPath ?? null,
    releaseYear: m.releaseYear ?? null,
    rating: m.voteAverage ?? undefined,
    watchedAt: m.watchedAt.toISOString(),
    userRating: m.userRating ?? undefined,
    mediaType: (m.mediaType === "tv" ? "tv" : "movie") as "movie" | "tv",
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {movies.length} movie{movies.length !== 1 ? "s" : ""} watched
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareButton />
          <DownloadPosterButton movieCount={movies.length} />
          <Link href="/search" className={cn(buttonVariants({ size: "sm" }))}>
            <Search className="h-4 w-4 mr-2" />
            Search Movies
          </Link>
        </div>
      </div>

      {/* Watched movies grid */}
      <ErrorBoundary>
        <DashboardClient initialMovies={movies} />
      </ErrorBoundary>
    </div>
  );
}
