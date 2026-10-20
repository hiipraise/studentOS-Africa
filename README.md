# StudentOS Africa

A trusted discovery platform for African students: verified scholarships, internships,
fellowships, grants, competitions, hackathons, programmes, student benefits and free tools,
plus an AI-assisted Finder, saved lists, deadline reminders and community reports.

Built on Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind, the native MongoDB
driver, Zod, Groq, Cloudinary and an email provider adapter. It is designed to run within free
tiers and to keep working when optional services are unavailable.

## Quick start

```bash
npm install
cp .env.example .env.local        # or create .env.local from the table below
npm run dev
```

Open <http://localhost:3000>. With no `MONGODB_URI` the public pages render their empty states;
with no `GROQ_API_KEY` the Finder returns deterministic results; with no email provider the
adapter logs messages instead of sending them.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build (works without secrets) |
| `npm run lint` | ESLint over app, scripts, tests and e2e |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright browser smoke tests |
| `npm run ensure-indexes` | Idempotent MongoDB indexes (run on deploy) |
| `npm run seed` | Seed the starter catalogue |
| `npm run import:opportunities -- --file=…` | Validate a CSV; add `--apply` to create drafts |
| `npm run migrate:opportunities-v2` | Additive listing migration (`--dry-run` first) |
| `npm run migrate:reports-v2` | Additive report moderation migration (`--dry-run` first) |
| `npm run scrape:all` | Run the maintained ingestion pipeline |
| `npm run check-links` | Weekly link checker (`--closing-soon` for the daily subset) |
| `npm run job:reminders` | Daily consolidated deadline reminders |
| `npm run job:digest` | Build the weekly digest draft (`--send` to deliver) |
| `npm run job:telegram` | Post new items and 3-day alerts to Telegram |
| `npm run job:stale` | Flag stale listings; exits non-zero over thresholds |

> Before the first production migration, export Atlas with `mongodump`. All migrations are
> additive and idempotent; always run `--dry-run` first.

## Environment variables

Only `MONGODB_URI` is required for the database-backed features. Everything else degrades.

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | For data | Atlas connection string |
| `MONGODB_DB` | No | Database name (default `studentos`) |
| `AUTH_SECRET` | For sign-in | Auth.js secret (also signs email/share tokens) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | For sign-in | Google OAuth client |
| `ADMIN_EMAILS` | For admin | Comma-separated admin allowlist |
| `EDITOR_EMAILS` | No | Comma-separated editor allowlist |
| `GROQ_API_KEY` | No | Finder explanations and optional ingestion enrichment |
| `GROQ_FINDER_MODEL` / `GROQ_INGEST_MODEL` | No | Model overrides |
| `SENDHIIV_API_KEY` or `RESEND_API_KEY` | No | Transactional email provider |
| `EMAIL_FROM` | No | From address (default `StudentOS Africa <hello@studentos.africa>`) |
| `CLOUDINARY_*` | For uploads | Cloudinary cloud name, key, secret |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | No | Owner alerts and channel auto-posts |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical URL for sitemap, emails and OG |
| `TURNSTILE_SECRET` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile on public forms |
| `CRON_SECRET` | No | Shared secret for protected cron endpoints |

## Architecture

```
src/app/                 Public routes, admin, API handlers, sitemap/robots/rss
  (public)               /opportunities /benefits /tools /guides /reports /finder
                         /deadlines /closing-soon /new /saved /account /suggest
  admin/                 Dashboard, CRUD, review queue, verification, reports, insights
  api/                   Auth, finder, reports, newsletter, saved, health, suggestions
src/components/          Server-first UI; client only for interaction
src/lib/
  domain/                countries, status engine, locale, report statistics, dedupe
  finder/                filter → score → compact prompt → validate → run
  email/                 provider-neutral send + templates
  schemas/               Zod schemas shared by API, forms and scripts
  auth.ts / authz.ts     Auth.js config and server guards
  search.ts              Atlas Search → text index → escaped regex
  events.ts              First-party, TTL'd analytics events
scripts/
  scrapers/              Polite ingestion pipeline (robots, delays, dedupe, provenance)
  migrations/            Additive, idempotent data migrations
  jobs/                  Link checker, reminders, digest, Telegram, stale listings
tests/ e2e/              Vitest + Playwright
docs/                    Runbook, content SOP, privacy notes, search setup, report
```

### Request flow highlights

- **Search**: Atlas compound query when available, otherwise a weighted MongoDB text index,
  otherwise escaped regex. Every path returns `total`, pagination and the engine used.
- **Finder**: deterministic eligibility filter, then scoring. Only the top 24 compact candidates
  are sent to Groq, with the profile inside delimiters and Zod-validated output. Any failure
  returns the deterministic ranking with a note.
- **Ingestion**: feeds/APIs first, official-link resolution, content-hash change detection,
  dedupe queue, and `$setOnInsert`/admin-protected fields so re-runs never unpublish.
- **Reports**: outcome is stored separately from moderation. Titles are resolved on the server;
  statistics only appear at `n ≥ 5`; links are stripped and duplicates rejected.
- **Accounts**: Auth.js with Google. Anonymous saves live in `localStorage` and merge on sign-in.
- **Email**: Sendhiiv → Resend → log adapter; double opt-in, one-click unsubscribe,
  preferences, one consolidated reminder per student per day.

## Jobs and schedules

| Workflow | Schedule (UTC) | Purpose |
|---|---|---|
| `.github/workflows/ingestion.yml` | Mon + Thu 05:17 UTC | Source ingestion, run summaries, owner alert |
| `.github/workflows/link-check.yml` | daily 05:40 + Mon 06:40 UTC | Link health, 3-strike flagging |
| `.github/workflows/jobs.yml` | daily/weekly | Reminders, digest draft, Telegram, stale report + health probe |
| `.github/workflows/ci.yml` | every push/PR | Lint, typecheck, tests, indexes, migrations, build, e2e |

Each job writes a summary to `ingest_runs`, shown on the admin dashboard and `/api/health`.

## SEO and growth

- `sitemap.xml`, `robots.txt`, `rss.xml`, canonical URLs and per-page metadata.
- JSON-LD: `BreadcrumbList`, `ItemList`, `Article` (guides), `FAQPage` only where real FAQs exist.
- Dynamic OG images for listings via `next/og`.
- Logged outbound redirects at `/go/[slug]` (allowlisted slug, no open redirect).
- Share buttons for WhatsApp, Telegram, X and copy-link.
- PWA lite: offline shell, cached saved list, `/offline`.
- French UI toggle for the main journeys (cookie-based, no third-party i18n runtime).

## Content operations

The product is the data. Read [docs/CONTENT_SOP.md](docs/CONTENT_SOP.md) before publishing:
official sources only, ISO country codes, explicit unknowns, verification metadata, and a
weekly review rhythm. Community suggestions land in the same review queue as scraped drafts.

## Documentation

- [Runbook](docs/RUNBOOK.md) — restore, rotate secrets, rerun jobs, handle a bad scrape, remove a listing fast.
- [Content SOP](docs/CONTENT_SOP.md) — verification rules and weekly rhythm.
- [Privacy notes](docs/PRIVACY_NOTES.md) — data inventory, retention, deletion.
- [Search setup](docs/SEARCH_SETUP.md) — Atlas index JSON and fallbacks.
- [Monetisation policy](docs/MONETISATION_POLICY.md) — sponsorship rules.
- [Improvement report](docs/IMPROVEMENT_REPORT.md) — before/after, metrics, deferred work.
- [Improvement log](docs/IMPROVEMENT_LOG.md) — sprint-by-sprint changes.
- [Deployment](docs/DEPLOYMENT.md) — first-release checklist.

## Licence and contributions

Content is curated for students; listing text is written in our own words and links to the
official source. Contributions go through `/suggest` and are moderated. Do not submit copied
aggregator paragraphs or unverified deadlines.
