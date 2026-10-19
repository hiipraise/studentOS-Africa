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
