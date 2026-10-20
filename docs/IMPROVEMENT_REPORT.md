# Improvement report

Scope: Sprints 0–9 of the improvement plan. This report states what changed,
what was verified, and what remains for the owner. It deliberately avoids
invented metrics: no live catalogue counts, Lighthouse scores or real-user
numbers were measured in this environment.

## Before → after

| Area | Before | After |
|---|---|---|
| Ingestion | Four scrapers with unverified selectors, no provenance, re-runs could overwrite editorial fields | One maintained source with robots/delay handling, content hashes, `$setOnInsert` protection, official-link resolution, dedupe queue, run records, link checker and scheduled workflows |
| Search | Client-side filtering and a single listing page | Atlas Search → MongoDB text index → escaped regex, with pagination, `total`, facets, country/category/level landing pages, closing-soon/new pages and related items |
| Finder | Whole catalogue sent to Groq; no validation | Deterministic eligibility filter and scoring; only ≤24 compact candidates reach the model; Zod-validated output; deterministic fallback and cached/shareable results |
| Accounts | Anonymous only | Google sign-in for students (admins remain allowlisted), saved items merged from `localStorage`, account page, reminders opt-out |
| Newsletter | Single provider call, no consent trail | Provider adapter (Sendhiiv → Resend → log), double opt-in tokens, unsubscribe, preferences, List-Unsubscribe header |
| Reports | Free-text comment and a single status field | Outcome separate from moderation, server-resolved benefit title, structured fields, optional email, duplicate detection, link stripping, honeypot/timing/Turnstile, statistics withheld below `n = 5`, availability matrix |
| Benefits pages | Static description | Verification age, confidence, editor guidance, country availability, community rates, tips, deadline calendar and logged outbound `/go` link |
| Admin | CRUD only | Review queue, needs-attention, verification, report moderation, suggestions, insights, audit trail, pending counts |
| Operations | No jobs or health signal | Reminders, weekly digest, Telegram posts, stale-listing alerts, protected unsubscribe, `/api/health`, GitHub Actions schedules |
| SEO/growth | Basic metadata | Canonicals, sitemap, robots, RSS, JSON-LD (Breadcrumb, ItemList, Article), dynamic OG images, share buttons, PWA offline shell, EN/FR toggle |
| Contracts | Loose types | Additive v2 types, Zod schemas shared by API/forms/scripts, additive idempotent migrations, comprehensive indexes |

## Verification performed

- `npm run typecheck` — passes with zero errors.
- `npm run lint` — passes with zero warnings/errors.
- `npm test` — 34 tests across 8 files pass (status engine, countries, query safety, shared components, scraper policy, report schema, report statistics, finder).
- `npm run build` — production build completes without `MONGODB_URI`; public pages render empty states.
- Migrations and job scripts are TypeScript-checked; database-backed runs were not executed because no deployment `MONGODB_URI` is configured.
- Playwright smoke tests were not run in this environment; the spec and CI job remain.

## Honest limitations

1. **No live database run.** Index creation, migrations, seeding, scrapers and
   jobs have not been executed against Atlas here. CI uses a disposable MongoDB
   for indexes and dry runs.
2. **One real ingestion source.** Only the scholarship source is maintained.
   The removed tool/offer scrapers were not reliable enough to keep.
3. **Selector drift is expected.** Scrapers fail safely, but a human still has
   to review extracted drafts.
4. **Sendhiiv bulk audience endpoint is unavailable.** The adapter sends
   transactional batches and leaves the provider's audience as a manual import.
5. **No formal privacy tooling.** Account deletion is a manual runbook step.
6. **No measured performance or SEO lift.** The architecture is faster and more
   cache-friendly, but no Lighthouse or Search Console data was collected.
7. **i18n is partial.** Navigation, footer, hero and key opportunity headings
   are translated; long-form content is English only.

## Owner actions before launch

1. Configure `MONGODB_URI`, `AUTH_SECRET`, Google OAuth, `ADMIN_EMAILS` and
   `NEXT_PUBLIC_APP_URL`.
2. Back up Atlas, run migrations with `--dry-run`, then apply them, then run
   `npm run ensure-indexes`.
3. Create the Atlas Search index from `scripts/atlas-search-index.json`.
4. Verify a handful of listings against official sources and set real
   verification metadata.
5. Run one ingestion, reminder, digest, Telegram and stale job manually.
6. Review `/api/health`, the admin queues and the newsletter confirmation flow.
7. Have the privacy policy, terms, monetisation labels and data-processing
   agreements reviewed by counsel.
8. Decide whether to keep `PROJECT_STATUS.md`; it has been replaced by this
   report and the README.
