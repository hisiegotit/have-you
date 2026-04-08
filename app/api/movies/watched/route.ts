import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { encryptNote, decryptNote } from "@/lib/note-encryption";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movies = await prisma.watchedMovie.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
  });

  const decrypted = movies.map((m) => ({
    ...m,
    note: m.note ? (decryptNote(m.note) ?? m.note) : null,
  }));

  return NextResponse.json({ movies: decrypted });
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

  const movie = await prisma.watchedMovie.upsert({
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
    update: { watchedAt: new Date() },
  });

  return NextResponse.json({ movie }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { movieId, userRating, note } = body;

  if (!movieId || typeof movieId !== "string") {
    return NextResponse.json({ error: "movieId is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if ("userRating" in body) {
    if (userRating !== null) {
      if (typeof userRating !== "number" || !Number.isInteger(userRating) || userRating < 1 || userRating > 5) {
        return NextResponse.json({ error: "userRating must be an integer between 1 and 5" }, { status: 400 });
      }
    }
    updateData.userRating = userRating ?? null;
  }

  if ("note" in body) {
    if (typeof note !== "string" && note !== null) {
      return NextResponse.json({ error: "note must be a string" }, { status: 400 });
    }
    updateData.note = note ? encryptNote(note) : null;
  }

  const movie = await prisma.watchedMovie.update({
    where: { userId_movieId: { userId: session.user.id, movieId } },
    data: updateData,
  });

  return NextResponse.json({ movie });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movieId = request.nextUrl.searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId is required" }, { status: 400 });

  await prisma.watchedMovie.deleteMany({
    where: { userId: session.user.id, movieId },
  });

  return NextResponse.json({ success: true });
}
