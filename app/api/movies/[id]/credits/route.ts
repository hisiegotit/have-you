import { NextRequest, NextResponse } from "next/server";
import { getMovieCredits } from "@/lib/tmdb-client";

/** Public route — TMDB data is not sensitive; API key stays server-side */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type") === "tv" ? "tv" : "movie";

  try {
    const cast = await getMovieCredits(Number(id), type);
    return NextResponse.json({ cast });
  } catch (err) {
    console.error("[movies/credits]", err);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
