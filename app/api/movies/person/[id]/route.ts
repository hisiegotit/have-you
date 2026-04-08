import { NextRequest, NextResponse } from "next/server";
import { getPersonCombinedCredits, posterUrl, genreIdsToNames } from "@/lib/tmdb-client";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { searchLimiter } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { success } = searchLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const personId = parseInt(id, 10);
  if (isNaN(personId)) {
    return NextResponse.json({ error: "Invalid person id" }, { status: 400 });
  }

  try {
    const data = await getPersonCombinedCredits(personId);

    const session = await getSession();
    let watchedIds = new Set<string>();
    if (session?.user) {
      const watched = await prisma.watchedMovie.findMany({
        where: { userId: session.user.id },
        select: { movieId: true },
      });
      watchedIds = new Set(watched.map((w) => w.movieId));
    }

    const results = data.results.map((item) => ({
      id: item.id,
      title: item.title,
      posterUrl: posterUrl(item.poster_path),
      posterPath: item.poster_path,
      releaseYear: item.release_date?.slice(0, 4) ?? null,
      rating: Math.round(item.vote_average * 10) / 10,
      overview: item.overview,
      genres: genreIdsToNames(item.genre_ids ?? []),
      mediaType: item.mediaType,
      isWatched: watchedIds.has(String(item.id)),
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[movies/person]", err);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
