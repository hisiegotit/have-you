import { describe, it, expect } from "vitest";
import type { MovieCardData } from "@/components/movie-card";

type SortBy = "date-desc" | "date-asc" | "rating" | "title-az";
type FilterType = "all" | "movie" | "tv";

/** Mirrors the useMemo logic in DashboardClient exactly */
function applyFiltersAndSort(
  movies: MovieCardData[],
  searchQuery: string,
  sortBy: SortBy,
  filterType: FilterType
): MovieCardData[] {
  let result = movies;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((m) => m.title.toLowerCase().includes(q));
  }

  if (filterType !== "all") {
    result = result.filter((m) => (m.mediaType ?? "movie") === filterType);
  }

  return [...result].sort((a, b) => {
    if (sortBy === "date-asc") return (a.watchedAt ?? "") < (b.watchedAt ?? "") ? -1 : 1;
    if (sortBy === "rating") {
      const diff = (b.userRating ?? 0) - (a.userRating ?? 0);
      return diff !== 0 ? diff : (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
    }
    if (sortBy === "title-az") return a.title.localeCompare(b.title);
    // default: date-desc
    return (b.watchedAt ?? "") > (a.watchedAt ?? "") ? 1 : -1;
  });
}

const base: MovieCardData = {
  id: "1",
  title: "Test",
  posterUrl: null,
  posterPath: null,
  releaseYear: null,
};

const movies: MovieCardData[] = [
  { ...base, id: "1", title: "Inception", watchedAt: "2026-01-01", userRating: 5, mediaType: "movie" },
  { ...base, id: "2", title: "Breaking Bad", watchedAt: "2026-03-01", userRating: 3, mediaType: "tv" },
  { ...base, id: "3", title: "Avatar", watchedAt: "2026-02-01", userRating: undefined, mediaType: "movie" },
];

describe("dashboard sort", () => {
  it("date-desc: newest first", () => {
    const result = applyFiltersAndSort(movies, "", "date-desc", "all");
    expect(result[0].id).toBe("2"); // 2026-03-01
    expect(result[1].id).toBe("3"); // 2026-02-01
    expect(result[2].id).toBe("1"); // 2026-01-01
  });

  it("date-asc: oldest first", () => {
    const result = applyFiltersAndSort(movies, "", "date-asc", "all");
    expect(result[0].id).toBe("1"); // 2026-01-01
  });

  it("rating: highest first, unrated goes last", () => {
    const result = applyFiltersAndSort(movies, "", "rating", "all");
    expect(result[0].id).toBe("1"); // rating 5
    expect(result[1].id).toBe("2"); // rating 3
    expect(result[2].id).toBe("3"); // unrated → 0
  });

  it("title-az: alphabetical", () => {
    const result = applyFiltersAndSort(movies, "", "title-az", "all");
    expect(result[0].title).toBe("Avatar");
    expect(result[1].title).toBe("Breaking Bad");
    expect(result[2].title).toBe("Inception");
  });
});

describe("dashboard filter", () => {
  it("search filters by title (case-insensitive)", () => {
    const result = applyFiltersAndSort(movies, "ava", "date-desc", "all");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Avatar");
  });

  it("type filter 'movie' excludes TV", () => {
    const result = applyFiltersAndSort(movies, "", "date-desc", "movie");
    expect(result.every((m) => m.mediaType === "movie")).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("type filter 'tv' returns only TV", () => {
    const result = applyFiltersAndSort(movies, "", "date-desc", "tv");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("search + type filter combine correctly", () => {
    const result = applyFiltersAndSort(movies, "a", "date-desc", "movie");
    // "Avatar" matches "a" and is a movie; "Breaking Bad" matches "a" but is TV; "Inception" has no "a"
    expect(result.every((m) => m.mediaType === "movie")).toBe(true);
    expect(result.map((m) => m.title)).toEqual(["Avatar"]);
  });

  it("no match returns empty array", () => {
    const result = applyFiltersAndSort(movies, "xyzzy", "date-desc", "all");
    expect(result).toHaveLength(0);
  });
});
