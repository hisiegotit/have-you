import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const movies = await prisma.watchedMovie.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
  });

  return NextResponse.json({ movies });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { movieId, movieTitle, posterPath, releaseYear, voteAverage, mediaType } = body;

  if (!movieId || typeof movieId !== "string" || !movieTitle) {
    return NextResponse.json({ error: "movieId and movieTitle are required" }, { status: 400 });
  }

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
    },
    update: { watchedAt: new Date() },
  });

  return NextResponse.json({ movie }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { movieId, userRating } = body;

  if (!movieId || typeof movieId !== "string") {
    return NextResponse.json({ error: "movieId is required" }, { status: 400 });
  }

  // Allow null to clear rating, otherwise validate 1-5 integer
  if (userRating !== null) {
    if (typeof userRating !== "number" || !Number.isInteger(userRating) || userRating < 1 || userRating > 5) {
      return NextResponse.json({ error: "userRating must be an integer between 1 and 5" }, { status: 400 });
    }
  }

  const movie = await prisma.watchedMovie.update({
    where: { userId_movieId: { userId: session.user.id, movieId } },
    data: { userRating: userRating ?? null },
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
