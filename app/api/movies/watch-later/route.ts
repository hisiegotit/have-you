import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movies = await prisma.watchLaterMovie.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json({ movies });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { movieId, movieTitle, posterPath, releaseYear, voteAverage, mediaType, genres } = body;

  if (!movieId || typeof movieId !== "string" || !movieTitle) {
    return NextResponse.json({ error: "movieId and movieTitle are required" }, { status: 400 });
  }

  const genreList = Array.isArray(genres) ? genres.filter((g: unknown) => typeof g === "string") : [];

  const movie = await prisma.watchLaterMovie.upsert({
    where: { userId_movieId: { userId: session.user.id, movieId } },
    create: {
      userId: session.user.id,
      movieId,
      movieTitle,
      posterPath: posterPath ?? null,
      releaseYear: releaseYear ?? null,
      voteAverage: voteAverage ?? null,
      mediaType: mediaType === "tv" ? "tv" : "movie",
      genres: genreList,
    },
    update: { addedAt: new Date() },
  });

  return NextResponse.json({ movie }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movieId = request.nextUrl.searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId is required" }, { status: 400 });

  await prisma.watchLaterMovie.deleteMany({
    where: { userId: session.user.id, movieId },
  });

  return NextResponse.json({ success: true });
}
