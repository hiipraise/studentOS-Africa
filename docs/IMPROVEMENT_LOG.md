# Improvement log

## Sprint 0 — Safety and foundations

- Added allowlisted Google OAuth admin access, route/action authorization, and removed the password-backed admin type and unused password packages.
- Added bounded query parsers and regex escaping; list page and API pagination no longer propagates `NaN` to MongoDB.
- Added hashed-IP MongoDB rate limits for finder, reports, newsletter, and admin uploads. Vercel's `x-vercel-forwarded-for` is the only IP source trusted by the limiter.
- Made database connection and environment validation lazy; Groq is constructed inside the finder handler and missing AI credentials return a 503 response.
- Hardened image uploads with admin checks, MIME/signature decoding, size/dimension caps, a folder allowlist, metadata removal by re-encoding, and a minimal response.
- Added idempotent database index creation, error/loading/not-found pages, legal draft pages, public icons/OG image/manifest, security headers/CSP, `en_NG` locale, and more accurate About copy.
- Added lint/typecheck/unit-test/index scripts, a CI workflow, Vitest and Testing Library tests, and a Playwright smoke spec. CI starts disposable MongoDB, checks indexes, and runs the browser smoke test.
- Measurements: query safety and shared UI tests pass (4 tests). Lighthouse, live catalogue counts, and bundle baselines were not measured in this sprint.
- Remaining: run `npm run ensure-indexes` with deployment MongoDB credentials; configure `AUTH_SECRET`, Google OAuth credentials and `ADMIN_EMAILS`; have the owner review the privacy/terms drafts with counsel.

## Sprint 1 — Structured and verifiable listings

- Added the additive opportunity v2 fields and matching Zod validation, an ISO alpha-2 Africa country table, country/region normalization, and a status engine that compares ISO instants (including offset deadlines).
- Public opportunity browsing and Finder candidate selection use country/region eligibility and suppress expired records by default. Added a “Show closed” control, close-date ordering, status/reopen presentation, closed detail states, and similar open links.
- Opportunity and benefit cards/details now show verification age, checker when recorded, source, confidence, a 45-day stale state, and a working outdated report that queues the listing for admin review. Added the admin needs-attention page.
- Added benefit country availability/verification/payment fields and tool `freeTier`/`studentOffer` fields. Added an idempotent opportunity v2 migration (`--dry-run` by default, `--apply` to write), dry-run CI step, CSV draft importer, blank CSV template, and content verification SOP with review cadence and coverage goals.
- Measurements: TypeScript and lint pass; 13 unit tests pass, including status branches, ISO timezone boundaries, African country codes, and region expansion. Local migration report could not connect because `MONGODB_URI` is not configured; CI runs the dry-run against its disposable empty database.
- Remaining: run the migration against a production backup and review its unmapped-country report; enter only owner-verified CSV records; editors should supply real verification dates, checker, confidence, and cycle data before clearing review flags.

## Sprint 2 — Editorial CMS and public API

- Added allowlisted admin CRUD for opportunities, benefits, tools and guides: list/table views, create/edit forms driven by the shared Zod schemas, audit history, and a review queue with bulk actions.
- Added verification and needs-attention dashboards, newsletter subscriber management, Cloudinary-backed image upload, and an outdated-listing report flow.
- Added public JSON endpoints for each collection plus suggestions, outdated reports and the Finder; added Auth.js session wiring and route/action guards.
- Added the first responsive admin shell, empty/error/loading states, and the CSV importer with a blank template.
- Measurements: typecheck and lint pass; the shared schema and status tests from earlier sprints are extended by the API contract tests. Live admin CRUD was not exercised against a deployment database.
- Remaining: enter owner-verified content, confirm the admin allowlist, and run one full create → review → publish cycle on staging.

## Sprint 3 — Reliable ingestion

- Added a single maintained scholarship source with robots.txt checks, polite delays, bounded retries and a stable user agent. Removed the three unverified tool/offer/GitHub scrapers rather than shipping selectors that could publish wrong facts.
- Added `extract-opportunity`, content hashing, change detection, `$setOnInsert`/editorial-field protection, official-link resolution, slug dedupe and a review queue for collisions.
- Every run writes an `ingest_runs` row with counts, status and errors. Added a weekly link checker with three-strike flagging, Telegram owner alerts, and `ingestion.yml` / `link-check.yml` schedules.
- Added scraper-policy and dedupe tests, and a dry-run mode that never writes.
- Measurements: ingestion modules typecheck and unit tests pass; no live scrape was run because the sandbox has no database or verified target access.
- Remaining: verify selectors against the live source, review the first drafts, and tune the stale/broken-link thresholds.

## Sprint 4 — Search and discovery

- Added `src/lib/search.ts` with three engines in order: Atlas compound search, MongoDB weighted text index, escaped regex fallback. Every path returns `total`, pagination and the engine used; a missing Atlas index is logged once and never breaks a page.
- Added country, category and level landing pages, closing-soon and new-this-week pages, related items, deadline/status/country/level filters, and saved-search-friendly URLs.
- Added ICS calendar downloads, `/go/[slug]` logged outbound redirects (allowlisted), sitemap, robots and RSS.
- Added dynamic OG images for opportunities and `scripts/atlas-search-index.json` plus `docs/SEARCH_SETUP.md`.
- Measurements: query parsing and country/status tests pass; search fallbacks were reviewed by type and unit coverage, not against a live Atlas cluster.
- Remaining: create the Atlas index, confirm the text index exists, and inspect zero-result queries in Insights.

## Sprint 5 — Finder v2

- Split the Finder into `filter → score → prompt → validate → run`. Eligibility is deterministic and never invented; missing data becomes “check”, not “eligible”.
- Only the top 24 compact candidates are sent to Groq, with the profile inside delimiters and a strict Zod response schema. Invalid or unavailable model output falls back to the deterministic ranking with a short reason.
- Added per-IP rate limits, a short-lived result cache, and signed share tokens for read-only result pages.
- Rebuilt the Finder form/results for mobile-first use, including score breakdowns, eligibility verdicts, save actions and a clear AI-disabled state.
- Measurements: finder filter/score/validation tests pass (deterministic ordering, closed-item exclusion, unknown eligibility, no invented criteria). No model call was made in tests.
- Remaining: review real Finder outputs for tone, tune weights with actual student feedback, and confirm Groq quota.

## Sprint 6 — Accounts, saves and email

- Added student Google sign-in through the existing Auth.js setup. Admins and editors remain allowlisted by `ADMIN_EMAILS` / `EDITOR_EMAILS`; a student account grants no admin access.
- Added `/login`, `/account` and `/saved`. Anonymous saves live in `localStorage` and merge into MongoDB on first sign-in; `/api/saved` enforces ownership.
- Added a provider-neutral email adapter (`Sendhiiv → Resend → log`) with shared templates, a double opt-in confirmation, one-click unsubscribe, a preferences page and `List-Unsubscribe`.
- Added reminder opt-out on the user record and consolidated reminder markers so a student receives at most one deadline email per day.
- Measurements: typecheck and lint pass; account and newsletter flows were not exercised end-to-end without OAuth and provider credentials.
- Remaining: configure OAuth and an email provider, test a real confirmation/unsubscribe round trip, and decide on a bulk-import step for Sendhiiv.

## Sprint 7 — Reports v2, benefit intelligence and suggestions

- Split report `outcome` (worked/partial/failed/unknown) from `moderation` (pending/approved/rejected). Legacy rows with only `status` remain readable through explicit filters.
- The server resolves the benefit title; clients cannot spoof it. Added structured school/country/date/time-to-approve/payment fields, an optional email for follow-up, comment cleaning (links stripped) and a 30-day duplicate hash check.
- Added honeypot, minimum completion time and optional Turnstile. Turnstile outages accept the submission for manual moderation instead of blocking students.
- Added windowed statistics (12 months), country availability derived from at least two reports, weighted success rate, and a hard rule that rates are hidden below `n = 5`. Admin-verified availability overrides community evidence.
- Rebuilt the benefit page with availability, stats, editor guidance, tips with voting, a claim CTA through `/go`, and a public reports list. Rebuilt admin moderation with outcome and moderation separated.
- Added `/suggest` with a validated suggestion API and review-queue entry, plus a report-v2 migration.
- Added `report-stats`, `report-schema` and comment-cleaning tests.
- Measurements: all 34 unit tests pass; no moderation or stats query was run against production data.
- Remaining: moderate the first real reports, check country mapping for free-text entries, and confirm the `n = 5` threshold with the editor.

## Sprint 8 — Operations, insights, PWA and i18n

- Added reminder, digest, Telegram and stale-listing jobs with a single scheduled workflow, manual dispatch, run summaries and an `/api/health` probe that reports database state and the last job runs.
- Added `/api/reminders/unsubscribe`, protected by signed tokens, and consolidated sending.
- Added `/admin/insights`: searches, zero-result queries, Finder runs, saves and outbound clicks, all from first-party events with a 180-day TTL. Admin pending counts now include the moderation queue.
- Added guide Article/Breadcrumb JSON-LD, canonicals, static params for guides, and a sitemap covering the new landing pages.
- Added a PWA lite: manifest, hand-written service worker, offline shell and cached saved list.
- Added cookie-based EN/FR UI for navigation, footer, hero and opportunity headings without adding an i18n runtime or making static pages dynamic.
- Added TTL and compound indexes for events, rate limits, finder cache/shares, saved items, reminders, suggestions, ingest runs, Telegram posts and digest drafts.
- Measurements: typecheck, lint and build pass; jobs were not run against a database in this environment.
- Remaining: run each job once on staging, confirm the health probe from the hosting region, and complete translations for long-form content.

## Sprint 9 — Hardening, documentation and release readiness

- Fixed the remaining strict-type issues (readonly Mongo filters, Finder share ids, account level typing, token payload indexing, report list props) and removed dead imports.
- Replaced inline anchors with `next/link` in the empty states for closing-soon and new-this-week.
- Added this report, the runbook, privacy notes, monetisation policy, README, search setup and an updated content SOP.
- Added `test-results/` and build/typecheck scratch output to `.gitignore`, and documented the release checklist.
- Final verification: `npm run typecheck`, `npm run lint`, `npm test` (34 passing) and `npm run build` all pass without deployment secrets. Migrations, index creation and scheduled jobs still require a real `MONGODB_URI`.
- Remaining owner work is listed in `docs/IMPROVEMENT_REPORT.md`; the main blockers are credentials, an Atlas backup, and counsel review of the public policies.
