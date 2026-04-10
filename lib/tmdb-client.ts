// Server-side only — TMDB_API_KEY must never reach the client

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  genre_ids: number[];
  adult?: boolean;
}

// TMDB genre ID → name (movie + TV combined)
const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  // TV-specific
  10759: "Action & Adventure", 10762: "Kids", 10763: "News",
  10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
  10767: "Talk", 10768: "War & Politics",
};

/** Maps TMDB genre_ids to human-readable names, skipping unknown IDs */
export function genreIdsToNames(ids: number[]): string[] {
  return ids.map((id) => GENRE_MAP[id]).filter(Boolean);
}

// Raw TV show shape from TMDB (fields differ from movie)
interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  overview: string;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

function posterUrl(path: string | null, size = "w342"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

async function tmdbFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  // Single retry on rate-limit
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1000));
    const retry = await fetch(url.toString());
    if (!retry.ok) throw new Error(`TMDB error ${retry.status}`);
    return retry.json() as Promise<T>;
  }

  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json() as Promise<T>;
}

// TMDB multi-search result (movies + TV shows in one call)
interface TMDBMultiResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;          // movies
  name?: string;           // TV shows
  poster_path: string | null;
  release_date?: string;   // movies
  first_air_date?: string; // TV shows
  vote_average: number;
  overview: string;
  genre_ids: number[];
  adult?: boolean;
}

interface TMDBMultiResponse {
  results: TMDBMultiResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchResponseWithType extends TMDBSearchResponse {
  results: (TMDBMovie & { mediaType: "movie" | "tv" })[];
}

function normalizeMultiResult(r: TMDBMultiResult): (TMDBMovie & { mediaType: "movie" | "tv" }) | null {
  if (r.media_type === "person") return null;
  return {
    id: r.id,
    title: r.title ?? r.name ?? "",
    poster_path: r.poster_path,
    release_date: r.release_date ?? r.first_air_date ?? "",
    vote_average: r.vote_average,
    overview: r.overview,
    genre_ids: r.genre_ids ?? [],
    mediaType: r.media_type,
  };
}

export async function searchMulti(query: string, page = 1): Promise<TMDBSearchResponseWithType> {
  const raw = await tmdbFetch<TMDBMultiResponse>("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
  });
  const results = raw.results
    .filter((r) => !isAdult(r))
    .map(normalizeMultiResult)
    .filter((r): r is NonNullable<typeof r> => r !== null);
  return { results, total_pages: raw.total_pages, total_results: raw.total_results };
}

export async function getTrendingMulti(page = 1): Promise<TMDBSearchResponseWithType> {
  const [movies, tv] = await Promise.all([
    getTrendingMovies(page),
    getTrendingTV(page),
  ]);
  // Interleave both lists and tag each with its mediaType
  const tagged = [
    ...movies.results.map((m) => ({ ...m, mediaType: "movie" as const })),
    ...tv.results.map((m) => ({ ...m, mediaType: "tv" as const })),
  ];
  return {
    results: tagged,
    total_pages: Math.max(movies.total_pages, tv.total_pages),
    total_results: movies.total_results + tv.total_results,
  };
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: Array<{ id: number; title?: string; name?: string; media_type: string }>;
}

export async function searchPeople(query: string, page = 1): Promise<{
  results: TMDBPerson[];
  total_pages: number;
  total_results: number;
}> {
  return tmdbFetch("/search/person", { query, page: String(page), include_adult: "false" });
}

export async function getPersonCombinedCredits(personId: number): Promise<TMDBSearchResponseWithType> {
  const raw = await tmdbFetch<{
    cast: Array<{
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      vote_average: number;
      overview: string;
      genre_ids?: number[];
      media_type: "movie" | "tv";
    }>;
  }>(`/person/${personId}/combined_credits`);

  const seen = new Set<number>();
  const results = raw.cast
    .filter((c) => {
      if (!c.poster_path || (c.media_type !== "movie" && c.media_type !== "tv")) return false;
      if ((c as { adult?: boolean }).adult === true) return false;
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    })
    .sort((a, b) => b.vote_average - a.vote_average)
    .map((c) => ({
      id: c.id,
      title: c.title ?? c.name ?? "",
      poster_path: c.poster_path,
      release_date: c.release_date ?? c.first_air_date ?? "",
      vote_average: c.vote_average,
      overview: c.overview,
      genre_ids: c.genre_ids ?? [],
      mediaType: c.media_type,
    }));

  return { results, total_pages: 1, total_results: results.length };
}

export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResponse> {
  const raw = await tmdbFetch<TMDBSearchResponse>("/search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
  return { ...raw, results: raw.results.filter((m) => !isAdult(m)) };
}

export async function getTrendingMovies(page = 1): Promise<TMDBSearchResponse> {
  const raw = await tmdbFetch<TMDBSearchResponse>("/trending/movie/week", { page: String(page), include_adult: "false" });
  return { ...raw, results: raw.results.filter((m) => !isAdult(m)) };
}

/** Returns true if a result should be excluded (adult content) */
function isAdult(item: { adult?: boolean }): boolean {
  return item.adult === true;
}

// Normalize a TV show's fields to the shared TMDBMovie shape
function normalizeTVShow(show: TMDBTVShow): TMDBMovie {
  return {
    id: show.id,
    title: show.name,
    poster_path: show.poster_path,
    release_date: show.first_air_date ?? "",
    vote_average: show.vote_average,
    overview: show.overview,
    genre_ids: show.genre_ids ?? [],
  };
}

export async function searchTV(query: string, page = 1): Promise<TMDBSearchResponse> {
  const raw = await tmdbFetch<{ results: TMDBTVShow[]; total_pages: number; total_results: number }>(
    "/search/tv",
    { query, page: String(page), include_adult: "false" },
  );
  return { results: raw.results.filter((s) => !isAdult(s)).map(normalizeTVShow), total_pages: raw.total_pages, total_results: raw.total_results };
}

export async function getTrendingTV(page = 1): Promise<TMDBSearchResponse> {
  const raw = await tmdbFetch<{ results: TMDBTVShow[]; total_pages: number; total_results: number }>(
    "/trending/tv/week",
    { page: String(page), include_adult: "false" },
  );
  return { results: raw.results.filter((s) => !isAdult(s)).map(normalizeTVShow), total_pages: raw.total_pages, total_results: raw.total_results };
}

/** Search movies/TV by actor name — finds the best-matching person then returns their credits */
export async function searchByActor(name: string, type: "movie" | "tv" = "movie", page = 1): Promise<TMDBSearchResponse> {
  const people = await tmdbFetch<{ results: Array<{ id: number }> }>(
    "/search/person",
    { query: name, include_adult: "false" },
  );

  if (people.results.length === 0) {
    return { results: [], total_pages: 0, total_results: 0 };
  }

  const personId = people.results[0].id;

  if (type === "tv") {
    const raw = await tmdbFetch<{ cast: TMDBTVShow[] }>(`/person/${personId}/tv_credits`);
    const sorted = raw.cast
      .filter((s) => s.poster_path)
      .sort((a, b) => b.vote_average - a.vote_average);
    const pageSize = 20;
    const slice = sorted.slice((page - 1) * pageSize, page * pageSize);
    return {
      results: slice.map(normalizeTVShow),
      total_pages: Math.ceil(sorted.length / pageSize),
      total_results: sorted.length,
    };
  }

  const raw = await tmdbFetch<{ cast: TMDBMovie[] }>(`/person/${personId}/movie_credits`);
  const sorted = raw.cast
    .filter((m) => m.poster_path)
    .sort((a, b) => b.vote_average - a.vote_average);
  const pageSize = 20;
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);
  return {
    results: slice,
    total_pages: Math.ceil(sorted.length / pageSize),
    total_results: sorted.length,
  };
}

export interface CastMember {
  name: string;
  character: string;
  profileUrl: string | null;
}

/** Fetches top 15 cast members for a movie or TV show, normalizing TMDB's differing shapes */
export async function getMovieCredits(id: number, type: "movie" | "tv"): Promise<CastMember[]> {
  const endpoint = type === "tv"
    ? `/tv/${id}/aggregate_credits`
    : `/movie/${id}/credits`;

  const data = await tmdbFetch<{
    cast: Array<{
      name: string;
      character?: string;
      roles?: Array<{ character: string }>;
      profile_path: string | null;
      order: number;
    }>;
  }>(endpoint);

  return data.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 15)
    .map((member) => ({
      name: member.name,
      character: member.character ?? member.roles?.[0]?.character ?? "",
      profileUrl: posterUrl(member.profile_path, "w185"),
    }));
}

// Re-export for convenience
export { posterUrl };
