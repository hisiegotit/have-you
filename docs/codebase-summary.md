# Codebase Summary

## Purpose
Personal movies tracking app. Sign up → search TMDB → mark watched → share public link → download gradient poster PNG.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.1 |
| Auth | Better Auth | 1.5.6 |
| Database | PostgreSQL + Prisma | Prisma 7.6 |
| DB Driver | @prisma/adapter-pg | 7.6.0 |
| UI | shadcn/ui (@base-ui/react) + Tailwind CSS v4 | — |
| Image Gen | node-canvas (Cairo/Pango system deps) | 3.x |
| Movie Data | TMDB API v3 | — |

## File Structure

```
app/
├── (auth)/login/page.tsx          # Login form (client)
├── (auth)/signup/page.tsx         # Signup form (client)
├── (auth)/layout.tsx              # Centered auth layout
├── api/auth/[...all]/route.ts     # Better Auth catch-all handler
├── api/movies/search/route.ts     # TMDB proxy + isWatched flag + rate limiting
├── api/movies/watched/route.ts    # GET/POST/DELETE/PATCH watched movies
├── api/movies/[id]/credits/route.ts # TMDB credits proxy (cast)
├── api/share/token/route.ts       # GET/POST/PUT share token
├── api/generate-poster/route.ts   # Canvas PNG generation
├── dashboard/page.tsx             # Server: watched movies + actions + error boundary
├── search/page.tsx                # Search page shell + error boundary
├── u/[token]/page.tsx             # Public read-only share page + expiry check
└── page.tsx                       # Redirect → /login

components/
├── navbar.tsx                     # Client: nav with auth state
├── error-boundary.tsx             # React error boundary (class component)
├── dashboard-client.tsx           # Client: sort/filter/search/rating + modal integration
├── search-page-client.tsx         # Client: search + watch state + modal integration
├── movie-card.tsx                 # Poster card + star rating + click handler
├── movie-card-skeleton.tsx        # Skeleton placeholder for cards
├── movie-grid.tsx                 # Responsive grid wrapper + loading state
├── movie-detail-modal.tsx         # Dialog with movie details + cast grid
├── search-bar.tsx                 # Debounced (300ms) input
├── share-button.tsx               # Copy/toggle/regenerate share link
├── download-poster-button.tsx     # Triggers PNG download
└── ui/                            # shadcn components

lib/
├── auth.ts                        # Better Auth server config + rate limiting
├── auth-client.ts                 # Better Auth React client
├── auth-helpers.ts                # getSession() server wrapper
├── prisma.ts                      # PrismaClient singleton (PrismaPg adapter)
├── rate-limit.ts                  # LRU-cache based IP rate limiter
├── tmdb-client.ts                 # TMDB API wrapper + getMovieCredits()
└── canvas-helpers.ts              # Gradient/overlay/rounded-image utils

prisma/
└── schema.prisma                  # 6 models: User, Session, Account, Verification, WatchedMovie, ShareToken
                                   # WatchedMovie includes: movieId, userId, watchedAt, posterUrl, title, voteAverage
                                   # + userRating (1-5 personal stars), mediaType ("movie"|"tv")

proxy.ts                           # Route protection (Next.js 16 proxy convention)
prisma.config.ts                   # Prisma v7 datasource config (loads .env.local)
```

## Key Constraints

- `TMDB_API_KEY` server-side only — search proxied via `/api/movies/search`
- Prisma v7: client at `@/lib/generated/prisma/client`, requires `PrismaPg` adapter
- shadcn v4 (`@base-ui/react`): no `asChild` — use `render` prop or `buttonVariants` on Link
- Next.js 16: `middleware.ts` → `proxy.ts`, export `proxy` (not `middleware`)
- Canvas requires system libs: `brew install cairo pango pkg-config pixman`
- Better Auth v1.x: adapter from `better-auth/adapters/prisma`, route handler via `toNextJsHandler`
