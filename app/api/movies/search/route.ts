import { NextRequest, NextResponse } from "next/server";
import { searchMovies, getTrendingMovies, searchTV, getTrendingTV, searchMulti, getTrendingMulti, searchPeople, posterUrl, genreIdsToNames } from "@/lib/tmdb-client";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { searchLimiter } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  const { success, remaining } = searchLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const trending = searchParams.get("trending") === "true";
  const rawType = searchParams.get("type");
  const type = rawType === "tv" ? "tv" : rawType === "all" ? "all" : "movie";
  const people = searchParams.get("people") === "true";

  if (!trending && query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    // ── Person search ────────────────────────────────────────────────────────
    if (people) {
      const data = await searchPeople(query, page);
      const results = data.results.map((p) => ({
        id: p.id,
        name: p.name,
        profileUrl: posterUrl(p.profile_path, "w185"),
        knownForDepartment: p.known_for_department,
        popularity: p.popularity,
        knownFor: p.known_for
          .slice(0, 3)
          .map((k) => k.title ?? k.name ?? "")
          .filter(Boolean),
      }));
      return NextResponse.json({ results, totalPages: data.total_pages });
    }

    // ── Movie / TV search ────────────────────────────────────────────────────
    const data = trending
      ? type === "all"
        ? await getTrendingMulti(page)
        : type === "tv" ? await getTrendingTV(page) : await getTrendingMovies(page)
      : type === "all"
        ? await searchMulti(query, page)
        : type === "tv" ? await searchTV(query, page) : await searchMovies(query, page);

    // Attach isWatched flag if user is authenticated
    const session = await getSession();
    let watchedIds = new Set<string>();
    if (session?.user) {
      const watched = await prisma.watchedMovie.findMany({
        where: { userId: session.user.id },
        select: { movieId: true },
      });
      watchedIds = new Set(watched.map((w) => w.movieId));
    }

    const results = data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: posterUrl(movie.poster_path),
      posterPath: movie.poster_path,
      releaseYear: movie.release_date?.slice(0, 4) ?? null,
      rating: Math.round(movie.vote_average * 10) / 10,
      overview: movie.overview,
      genres: genreIdsToNames(movie.genre_ids ?? []),
      mediaType: (movie as { mediaType?: "movie" | "tv" }).mediaType ?? (type === "tv" ? "tv" : "movie"),
      isWatched: watchedIds.has(String(movie.id)),
    }));

    return NextResponse.json({ results, totalPages: data.total_pages });
  } catch (err) {
    console.error("[movies/search]", err);
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
