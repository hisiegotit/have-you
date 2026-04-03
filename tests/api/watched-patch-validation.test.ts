import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth helpers and prisma before importing the handler
vi.mock("@/lib/auth-helpers", () => ({
  getSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    watchedMovie: {
      update: vi.fn(),
    },
  },
}));

import { PATCH } from "@/app/api/movies/watched/route";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const mockSession = { user: { id: "user-1", name: "Test" } };

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/movies/watched", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/movies/watched", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.watchedMovie.update).mockResolvedValue({} as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ movieId: "123", userRating: 3 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when movieId is missing", async () => {
    const res = await PATCH(makeRequest({ userRating: 3 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when userRating is 0", async () => {
    const res = await PATCH(makeRequest({ movieId: "123", userRating: 0 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/1 and 5/);
  });

  it("returns 400 when userRating is 6", async () => {
    const res = await PATCH(makeRequest({ movieId: "123", userRating: 6 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when userRating is a string", async () => {
    const res = await PATCH(makeRequest({ movieId: "123", userRating: "five" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when userRating is a float", async () => {
    const res = await PATCH(makeRequest({ movieId: "123", userRating: 2.5 }));
    expect(res.status).toBe(400);
  });

  it("accepts valid rating 1-5", async () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const res = await PATCH(makeRequest({ movieId: "123", userRating: rating }));
      expect(res.status).toBe(200);
    }
  });

  it("accepts null to clear rating", async () => {
    const res = await PATCH(makeRequest({ movieId: "123", userRating: null }));
    expect(res.status).toBe(200);
    expect(prisma.watchedMovie.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userRating: null } })
    );
  });
});
