# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Run Vite frontend (port 5173) + Express API (port 3000) concurrently
pnpm build        # Production build
pnpm lint         # ESLint validation
pnpm api          # Run only the Express local dev server
pnpm vercel-dev   # Vercel CLI local dev (alternative to pnpm dev)
```

No test framework is configured.

## Architecture

**Photography portfolio site** — React 19 + Vite frontend, deployed to Vercel with serverless API functions. Local development uses an Express server that mirrors the Vercel function structure.

### Content Pipeline

All content lives in **Dropbox**, not the repo:
- `categories.yml` — category metadata and access control
- `access.yml` — user credentials (PBKDF2-SHA512 hashed codes) and category access levels
- `playlists.yml` — YouTube playlist ID mappings
- `about.html` — About page content
- `quotes_list.txt` — Daily rotating quotes
- `/{categoryDir}/*.jpg` — Image files (filenames encode tags: `public`, `fav`, `admin`)

The catalog is loaded once on first API call (`/api/catalog`), cached in-memory, and refreshed explicitly. Image URLs are Dropbox temporary links (15-min expiry), cached client-side in a `Map`.

### API Layer

`api/` contains Vercel serverless functions. **`local-api-server.js`** auto-discovers and mounts them as Express routes, converting Vercel's `[param]` filename convention to Express `:param` syntax. All handlers export `default async function(req, res)`.

Key endpoints:
- `GET /api/catalog` — full catalog (categories, images, quotes, about content)
- `GET /api/image/:path/url` — generate temporary Dropbox URL for an image
- `GET /api/videos/:playlistId` — fetch YouTube playlist + video stats
- `POST /api/verify` — validate an access code against `access.yml`

### Access Control

Category access uses a code-based system (not auth sessions):
- Users submit a code → `/api/verify` checks it against PBKDF2-SHA512 hashes in `access.yml`
- Granted access stored in `sessionStorage` (clears on tab close)
- `CategoryRoute.jsx` wraps all category pages and enforces this check

### Client-Side Structure

- **`src/lib/catalog.js`** — singleton catalog fetch + client-side URL caching
- **`src/lib/access.js`** — sessionStorage-based access grant tracking
- **`src/components/Main.jsx`** — all route definitions
- **`src/hooks/useFetchImages.jsx`** — fetches images tagged `public` or `fav`

### Routing

React Router v7. Routes: `/`, `/category/:categoryName`, `/videos/:playlist`, `/about`. Vercel rewrites non-API paths to `/` for SPA fallback.

### Styling

Tailwind CSS with class-based dark mode. Custom fonts: **Cormorant Garamond** (body), **Big Shoulders Display** (titles). Theme colors defined in `tailwind.config.ts` — primary (white), secondary (gray), background (black).

## Environment Variables

Required in Vercel (and `.env.local` for local dev):
- `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`
- `YOUTUBE_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (for future admin features)
- `ACCESS_CODE_SALT` (for PBKDF2 hashing)

Scripts in `scripts/` handle Dropbox OAuth token refresh.
