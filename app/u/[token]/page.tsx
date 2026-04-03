import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MovieGrid } from "@/components/movie-grid";
import { posterUrl } from "@/lib/tmdb-client";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const share = await prisma.shareToken.findUnique({
    where: { token },
    include: { user: { select: { name: true } } },
  });
  if (!share || !share.isActive) return { title: "Not Found" };
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return { title: "Not Found" };
  return {
    title: `${share.user.name}'s Watched Movies`,
    description: `Movies watched by ${share.user.name}`,
    openGraph: {
      title: `${share.user.name}'s Watched Movies`,
      description: `Movies watched by ${share.user.name}`,
    },
  };
}

export default async function PublicSharePage({ params }: Props) {
  const { token } = await params;

  const share = await prisma.shareToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!share || !share.isActive) notFound();
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) notFound();

  const watched = await prisma.watchedMovie.findMany({
    where: { userId: share.user.id },
    orderBy: { watchedAt: "desc" },
  });

  const movies = watched.map((m) => ({
    id: m.movieId,
    title: m.movieTitle,
    posterUrl: posterUrl(m.posterPath ?? null),
    posterPath: m.posterPath ?? null,
    releaseYear: null,
    watchedAt: m.watchedAt.toISOString(),
    userRating: m.userRating ?? undefined,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{share.user.name}&apos;s Watched Movies</h1>
        <p className="text-muted-foreground mt-1">{movies.length} movie{movies.length !== 1 ? "s" : ""} watched</p>
      </div>
      <MovieGrid
        movies={movies}
        watchedIds={new Set(movies.map((m) => String(m.id)))}
        showWatchButton={false}
        emptyMessage="No movies watched yet."
      />
    </div>
  );
}
