# Deployment Guide

Recommended host: **Railway** (Docker-native, PostgreSQL add-on, free tier available).
Alternatives: Fly.io, Render (Docker), any VPS with Docker.

> **Why not Vercel?** The poster generation feature uses `node-canvas`, which requires
> Cairo/Pango system libraries not available on Vercel's serverless runtime.

---

## Prerequisites

- Docker installed locally (for testing the image)
- A [Railway](https://railway.app) account
- A [TMDB API key](https://developer.themoviedb.org/) (free)
- A [Sentry DSN](https://sentry.io) (free tier, optional but recommended)

---

## 1. Provision PostgreSQL

In Railway: **New Project → Add PostgreSQL**.

Copy the `DATABASE_URL` from the PostgreSQL service's **Variables** tab.
It looks like: `postgresql://postgres:password@monorail.proxy.rlwy.net:12345/railway`

---

## 2. Generate secrets

```bash
# Better Auth secret (run locally)
openssl rand -base64 32
```

---

## 3. Set environment variables

In Railway: **Your Service → Variables → Raw Editor**, paste:

```env
DATABASE_URL=postgresql://...          # from step 1
BETTER_AUTH_SECRET=...                 # from step 2
NEXT_PUBLIC_APP_URL=https://your-app.railway.app   # your Railway public URL
TMDB_API_KEY=...                       # from TMDB developer portal
SENTRY_DSN=...                         # optional, from Sentry project settings
NODE_ENV=production
```

> `NEXT_PUBLIC_APP_URL` must match your actual domain exactly — no trailing slash.
> Share links will break if this is wrong.

---

## 4. Deploy

### Option A — Railway GitHub integration (recommended)

1. Push this repo to GitHub
2. Railway → **New Project → Deploy from GitHub repo**
3. Railway auto-detects the `Dockerfile` and builds it
4. First deploy runs `npx prisma migrate deploy` automatically via the `CMD`

### Option B — Railway CLI

```bash
npm install -g @railway/cli
railway login
railway link          # link to your Railway project
railway up            # build + deploy
```

### Option C — Local Docker test

```bash
docker build -t my-movies .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e BETTER_AUTH_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -e TMDB_API_KEY="..." \
  my-movies
```

---

## 5. Post-deploy smoke test

- [ ] Visit the app URL — should redirect to `/login`
- [ ] Sign up for an account
- [ ] Search for a movie and mark it watched
- [ ] Generate a share link — verify it opens correctly
- [ ] Download a poster — confirms `node-canvas` is working
- [ ] Toggle dark mode — persists on reload

---

## 6. Future migrations

Every `prisma migrate dev` run locally creates a migration file in `prisma/migrations/`.
Commit these files. On next deploy, `prisma migrate deploy` (in the `CMD`) applies them automatically.

**Never run `prisma migrate dev` in production.**

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| In-memory rate limiter (`lru-cache`) | Resets on restart; doesn't sync across instances | Acceptable for single-instance deploy; upgrade to Redis if scaling |
| `node-canvas` system deps | Can't deploy to Vercel/Netlify | Use Docker-based host (this guide) |
| No horizontal scaling | Rate limiter + session state not shared | Single instance is fine for personal use |

---

## Rollback

Railway keeps deployment history. Click **Deployments → previous deploy → Redeploy**.

For database rollback, Prisma does not auto-generate down migrations.
All schema changes in this project are additive (nullable columns, defaults) — safe to roll back the app code without touching the DB.
