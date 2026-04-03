import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/tmdb-client", () => ({
  getMovieCredits: vi.fn(),
}));

import { GET } from "@/app/api/movies/[id]/credits/route";
import { getMovieCredits } from "@/lib/tmdb-client";

const mockCast = [
  { name: "Tom Hanks", character: "Forrest Gump", profileUrl: "https://image.tmdb.org/t/p/w185/xyz.jpg" },
  { name: "Robin Wright", character: "Jenny", profileUrl: null },
];

function makeRequest(id: string, type?: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const url = new URL(`http://localhost/api/movies/${id}/credits`);
  if (type) url.searchParams.set("type", type);
  return [
    new NextRequest(url),
    { params: Promise.resolve({ id }) },
  ];
}

describe("GET /api/movies/[id]/credits", () => {
  beforeEach(() => {
    vi.mocked(getMovieCredits).mockResolvedValue(mockCast);
  });

  it("returns cast array", async () => {
    const [req, ctx] = makeRequest("550");
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cast).toEqual(mockCast);
  });

  it("defaults to movie type when type param absent", async () => {
    const [req, ctx] = makeRequest("550");
    await GET(req, ctx);
    expect(getMovieCredits).toHaveBeenCalledWith(550, "movie");
  });

  it("uses tv type when type=tv", async () => {
    const [req, ctx] = makeRequest("1396", "tv");
    await GET(req, ctx);
    expect(getMovieCredits).toHaveBeenCalledWith(1396, "tv");
  });

  it("returns 500 when TMDB fetch fails", async () => {
    vi.mocked(getMovieCredits).mockRejectedValue(new Error("TMDB down"));
    const [req, ctx] = makeRequest("550");
    const res = await GET(req, ctx);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
