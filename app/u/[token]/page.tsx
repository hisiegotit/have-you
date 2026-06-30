import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SharedPageClient } from "@/components/shared-page-client";
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
    releaseYear: m.releaseYear ?? null,
    watchedAt: m.watchedAt.toISOString(),
    userRating: m.userRating ?? undefined,
    mediaType: (m.mediaType ?? "movie") as "movie" | "tv",
    genres: m.genres ?? [],
  }));

  return <SharedPageClient movies={movies} userName={share.user.name ?? "Someone"} />;
}
