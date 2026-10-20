# STUDENTOS AFRICA — CODEX IMPROVEMENT PROMPT

> Put this file in the repo root and hand it to your coding agent (Codex / Claude Code).
> Goal: turn StudentOS Africa from a tidy catalogue into a **trusted, searchable, personalised opportunity platform that students come back to**, without a rewrite and without paid infrastructure.

---

## 0. Your role and how to work

You are a senior full-stack engineer and product engineer taking over `studentOS-Africa` (Next.js 15 App Router, React 19, TypeScript strict, Tailwind, MongoDB native driver, Zod, Groq SDK, Cloudinary, Sendhiiv, cheerio scrapers). A clean `tsc --noEmit` already passes; your job is not to make it compile, it is to make it **correct, trustworthy, safe to operate, and worth returning to**.

Operating rules:

1. **Reproduce before fixing.** Findings tagged **[verified]** were confirmed by running code; **[read]** came from reading and must be re-checked first (write a failing test or a small script).
2. **Sprints run in order.** Sprint 0 (safety) and Sprint 1 (data model) are prerequisites for everything else.
3. **One commit per task group**, message `sprint-N: <what>`. After each sprint append to `docs/IMPROVEMENT_LOG.md` (what changed, what you measured, what remains).
4. **Never invent content.** No fabricated deadlines, amounts, eligibility or reports. Unknown is `null` plus a visible "unverified" state. The product's whole value is trust.
5. **Additive migrations.** Existing documents must keep loading. Put idempotent scripts in `scripts/migrations/` with `--dry-run`. Remind the owner to export the Atlas database (`mongodump`) before the first migration.
6. **Keep the stack.** No framework swaps. Prefer small, dependency-light solutions; justify every new package in the log.
7. **Run before each commit:** `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` (with stub env vars so the build does not need live services).
8. **Mark each task P0 / P1 / P2.** If time-boxed, cut P2, then P1.
9. **Mobile-first for Africa:** assume mid-range Android, patchy 3G/4G, expensive data, and heavy WhatsApp/Telegram use. Every page must stay usable on a slow connection.

---

## 1. Mission and success metrics

Make the platform **accurate** (listings are current and verifiable), **findable** (search, filters, SEO), **personal** (finder, saved items, reminders) and **operable** (admin, automated ingestion, no manual database edits).

Instrument these from Sprint 8 and report them in `docs/IMPROVEMENT_REPORT.md`:

| Metric | Why it matters |
|---|---|
| % of published listings verified in the last 30 days | Trust |
| % of outbound links healthy (HTTP 2xx/3xx) | Trust, wasted student time |
| Zero-result search rate and top zero-result queries | Shows what content is missing |
| "Apply" outbound click rate per listing | Real usefulness |
| Finder completion rate and click-through on results | AI value |
| Newsletter confirmed-subscriber rate and weekly open/click | Retention channel |
| Returning visitors, saved items, reminders sent | Habit |
| Core Web Vitals on a throttled mid-range Android profile | Reach |

---

## 2. Constraints (stay free or near-free)

- Assume **Vercel Hobby**, **MongoDB Atlas M0** (Atlas Search is available on the free tier with limits; verify), **Groq free tier** (strict per-minute and per-day token limits; verify current numbers), **Cloudinary free**, **GitHub Actions** for schedulers (Vercel Hobby cron is limited; verify) and free email/transactional tiers behind a **provider adapter** so Sendhiiv can be swapped.
- Every external dependency (Groq, email, Cloudinary, scraped sites) is **optional at runtime**: when it is down the feature degrades gracefully and says so. Nothing may crash a page.
- Be a polite scraper: identify the bot, respect `robots.txt`, rate-limit, cache, and prefer APIs/feeds over HTML selectors.
- Do not copy aggregator text wholesale. Store short original summaries and link to the official source (see Sprint 3).

---

## 3. Findings catalogue

IDs are referenced from the sprints. Names of files/functions are used instead of line numbers.

### 3.1 Security and abuse

- **SEC-1 [read] Admin-style endpoints are public.** `POST /api/opportunities` and `POST /api/benefits` accept any valid body and accept `published: true`, so anyone can publish content to the live site. `POST /api/upload` is an open Cloudinary upload (the file even comments that it is unprotected). `next-auth` is installed but unused; there is no login, middleware or role check anywhere.
- **SEC-2 [read] Regex injection / ReDoS.** `lib/data/opportunities.ts`, `api/opportunities/route.ts` and `api/reports/route.ts` pass user input straight into `$regex` (`q`, `country`) with no escaping or length cap. A crafted pattern can pin the database CPU.
- **SEC-3 [read] No rate limiting** on `/api/finder` (each call spends Groq quota), `/api/reports`, `/api/newsletter`, `/api/upload`.
- **SEC-4 [read] Upload hardening.** `/api/upload` trusts the client-supplied `file.type`, accepts an arbitrary `folder` string (any Cloudinary folder), and runs no content check.
- **SEC-5 [read] Prompt injection.** `api/finder/route.ts` interpolates `careerGoal`, `course`, `interests` directly into the LLM prompt next to catalogue data, with no delimiting or output validation beyond `JSON.parse`.
- **SEC-6 [read] Spoofable report data.** `POST /api/reports` stores the client-supplied `benefitTitle`; `benefitId` is never checked against a real benefit.
- **SEC-7 [read] No security headers/CSP,** `suppressHydrationWarning` on `<html>` and `<body>` hides real hydration issues.

### 3.2 Correctness bugs

- **BUG-1 [verified] Bad `page`/`pageSize` crash the API.** `Math.max(1, parseInt("abc", 10))` is `NaN`; `.skip(NaN)` then throws, so `?page=abc` returns 500 on every list route.
- **BUG-2 [verified] Missing key crashes at import.** `api/finder/route.ts` does `new Groq({ apiKey: process.env.GROQ_API_KEY })` at module load; with no key the SDK throws at import time, which can break `next build` page-data collection and takes the route down instead of degrading. `lib/db.ts` similarly throws at import when `MONGODB_URI` is unset.
- **BUG-3 [read] The user's "did it work?" answer is thrown away.** `ReportForm` sends `status: "approved" | "rejected"` (the student's outcome) but `POST /api/reports` forces `status: "pending"`, and `status` is also the moderation state. The outcome is never stored, so reports cannot be aggregated into a success rate.
- **BUG-4 [read] Reports can fail validation for normal users.** `CreateReportSchema` requires `benefitId` (min 1) but the form's benefit field is free text with a hidden id that is only filled when arriving with query params; the generic "Submit a Report" path returns "benefitId is required".
- **BUG-5 [verified] Country filtering cannot work.** `Opportunity.countries` is documented as ISO alpha-2 or "Global", the API filters `countries === "NG"`, but the seed uses free text: "All African Countries", "All 54 African Countries", "Sub-Saharan Africa", "Global — Open to African Applicants", "Nigeria". The filter (and country awareness anywhere) matches nothing; the UI has no country filter for this reason.
- **BUG-6 [verified] Seed content is already stale.** Chevening's seeded deadline is `2026-10-07`, which has passed; recurring programmes are modelled as `deadline: null`. There is no concept of an annual cycle, opening date, or "closed, reopens ~X".
- **BUG-7 [read] Expired items are listed as live.** `getOpportunities` and `/api/opportunities` do not exclude past deadlines and sort by `featured, createdAt`, not by closing date; the detail page still shows "Apply Now" for closed items.
- **BUG-8 [read] Atlas Search branch is half-built.** It returns no `total`/`meta`, applies `$match` after `$search` instead of using compound filters, and swallows all errors into the regex fallback.
- **BUG-9 [read] Scraper upserts overwrite editorial state.** `scrapers/lib/pipeline.ts` does `$set: { ...item }` with `published: false` and `featured: false`, so re-running a scraper **unpublishes and un-features** reviewed items and overwrites manual edits.
- **BUG-10 [read] Scraped `officialLink` is the aggregator post,** not the programme's official site (`scholarship-sites.ts`), and `deadline` is always `null`, countries are keyword-guessed from free text, slugs can collide across sources.
- **BUG-11 [read] Newsletter correctness.** Emails are not lower-cased, there is no unique index (race creates duplicates), the welcome email is awaited inside the request, there is no confirmation (double opt-in) and no unsubscribe, and `addToSendhiivAudience` is a stub, so nobody ever receives the actual newsletter.
- **BUG-12 [read] Missing public assets and SEO files.** There is no `public/` directory, but `layout.tsx` references `/og-image.png` and a favicon; there is no `robots.ts`, `sitemap.ts`, JSON-LD, `not-found.tsx`, `error.tsx` or `loading.tsx`.
- **BUG-13 [read] Honesty gap in copy.** The About page says listings are "all verified" and every benefit has "real reports from real students", but there is no verification metadata and most benefits have no reports.

### 3.3 Product gaps (where the value is)

- **PROD-1** No admin dashboard, so content can only change by editing the database or re-seeding.
- **PROD-2** Student value stops at browsing: no accounts, saved items, application tracking, or deadline reminders, even though deadlines are already stored.
- **PROD-3** The AI Finder sends up to 100 full opportunity documents (with long descriptions) to the model on every request, so it will hit token and rate limits as the catalogue grows; it discards the model's per-item `reason`; it does not pre-filter by country, level or deadline; there is no fallback when Groq is unavailable; there is no caching.
- **PROD-4** Search is Enter-only, regex-based, with no country/level/funding/deadline facets and no "closing soon" view.
- **PROD-5** Scrapers run manually; two of four are placeholders; there is no scheduling, source health, dedupe, link checking or review queue.
- **PROD-6** No analytics or feedback loop: nothing records outbound clicks, zero-result searches or finder demand, so there is no evidence about what to add next.
- **PROD-7** Benefit pages ignore the real African pain points: whether a perk works for a Nigerian/Kenyan/Ghanaian student, how verification and payment actually go, and which perks are geo-blocked.
- **PROD-8 [verified]** The footer links to `/privacy` and `/terms`, but neither page exists (404). The newsletter page promises "Unsubscribe anytime" yet no unsubscribe mechanism exists. There is no consent record or data-deletion path although the app collects emails and student profile data (verify obligations under applicable law, e.g. Nigeria's data protection law, with the owner).
- **PROD-9** No tests and no CI; `PROJECT_STATUS.md` is the only quality record.

### 3.4 Hygiene

`next-auth` and `framer-motion` are installed but not imported anywhere under `src/` or `scripts/` **[verified]**; `getDb()` hard-codes the database name `studentos`; the `Navbar` uses a non-existent `font-700` class; `locale` is `en_US`; `admins` collection with `passwordHash` conflicts with any Auth.js adapter decision (resolved in Sprint 2).

---
## 4. Target shape

```
Public site (Next.js, mostly static + ISR)
  /opportunities  /benefits  /tools  /guides  /reports  /finder  /deadlines  /saved  /account
  /go/[slug]  (logged outbound redirect)    /privacy  /terms    sitemap.xml  robots.txt  rss.xml
Student accounts-lite (Auth.js: Google/e-mail link) -> saved items, application tracker, reminders, profile
Admin (/admin, Auth.js allowlist)               -> CRUD, review queue, verification, analytics, audit log
Ingestion (GitHub Actions cron -> scripts)      -> sources -> enrich -> dedupe -> DRAFT queue -> admin review
Jobs (GitHub Actions cron)                      -> link checker, reminders, weekly digest, stale-listing report
MongoDB (Atlas M0)  <- indexes, TTL collections (rate limits, finder cache, events)
```

Suggested folders (adapt, keep the separation):

```
src/lib/{auth,authz,rate-limit,env,db,safe-query,escape}.ts
src/lib/domain/{eligibility,status,countries,dedupe}.ts
src/lib/finder/{filter,score,prompt,validate,run}.ts
src/lib/email/{adapter,sendhiiv,templates}.ts
src/app/admin/...   src/app/(student)/...   src/app/api/...
scripts/{migrations,ingest,jobs,ensure-indexes.ts}
tests/  e2e/  docs/
```

---

## 5. Sprints

### Sprint 0 — Safety and foundations

Goal: nobody can publish, upload or burn quota; the app builds and boots without every secret; the basics of a production site exist.

- **S0.1 (P0) Authentication and authorisation (SEC-1).** Use **Auth.js v5** (already installed). Admin login by OAuth (GitHub or Google) restricted to an `ADMIN_EMAILS` allowlist in env; no passwords stored. Decide now: **drop the `admins` collection and `passwordHash`** from the types. Add `requireAdmin()` and call it inside every mutating route and every admin server action (do not rely on middleware alone). Add `middleware.ts` to protect `/admin/*`. Gate `POST /api/opportunities`, `/api/benefits`, `/api/upload` behind admin. Add `PATCH`/`DELETE` routes later (Sprint 2) with the same guard. Unauthenticated calls must return 401 with a stable error shape.
- **S0.2 (P0) Input safety (SEC-2, BUG-1).** `lib/escape.ts` with `escapeRegExp`; `lib/safe-query.ts` with `parsePage`, `parsePageSize`, `parseEnum`, `parseBool`, `parseSearchText` (trim, collapse spaces, max 100 chars). Replace every `parseInt(searchParams...)` and every `$regex` built from user input. Add tests for `NaN`, negatives, huge numbers, regex metacharacters, Unicode.
- **S0.3 (P0) Rate limiting (SEC-3).** Small `lib/rate-limit.ts` backed by a Mongo TTL collection (`rate_limits`) keyed by hashed IP + route (read the client IP from the platform's forwarded header; verify which header Vercel sets and trust only that). Limits: finder 5/min and 30/day per IP, reports 5/hour, newsletter 5/hour, uploads (admin only) generous. Return 429 with `Retry-After`.
- **S0.4 (P0) Lazy, safe configuration (BUG-2).** `lib/env.ts` with a Zod-validated, lazily evaluated config. `getDb()` connects on first use and reads the database name from `MONGODB_DB` (default `studentos`). Create the Groq client inside the handler, and return a friendly "AI is unavailable" response when the key is missing. `next build` must pass with no secrets set.
- **S0.5 (P0) Upload hardening (SEC-4).** Admin-only. Validate the real file signature (magic bytes), size, dimensions; allowlist `folder` to `{opportunities, benefits, tools, guides}`; strip metadata; return only the stored URL and public id.
- **S0.6 (P0) Indexes script.** `scripts/ensure-indexes.ts` (idempotent, run in CI and on deploy): unique `slug` per content collection; compound `{published, deadline}`; `{published, category}`; `{published, "eligibility.countries"}` (Sprint 1 field); unique lower-cased `newsletter.email`; `reports {benefitId, moderation, createdAt}`; TTL on `rate_limits`, `finder_cache`, `events`.
- **S0.7 (P0) Production basics (BUG-12).** Add `public/` with favicon set, `og-image.png`, `manifest.webmanifest`; `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx` (and per-section where useful); `/privacy` and `/terms` pages (plain-language drafts for the owner to review with a lawyer); security headers and a Content-Security-Policy in `next.config.ts` (allow Cloudinary images and the fonts you actually use); set `locale: "en_NG"`; remove `suppressHydrationWarning` and fix any real mismatches.
- **S0.8 (P1) Test and CI scaffold (PROD-9).** Vitest + Testing Library, Playwright smoke test, GitHub Actions running lint, typecheck, unit tests, build with stub env. Remove unused deps (`framer-motion` if still unused, or use it deliberately).
- **S0.9 (P1) Copy honesty (BUG-13).** Temporarily soften "all verified" until Sprint 1/2 ship verification metadata; reinstate when true.

**Acceptance:** unauthenticated `POST /api/opportunities` and `/api/upload` return 401; `?page=abc` returns page 1; `q=(a+)+$` is harmless; `npm run build` passes with no secrets; `/privacy`, `/terms`, favicon and OG image resolve.

---

### Sprint 1 — A data model students and the AI can rely on

Goal: structured, verifiable listings so filtering, the Finder, reminders and SEO all work.

- **S1.1 (P0) Opportunity schema v2 (BUG-5, BUG-6, BUG-7).** Additive fields with Zod + TypeScript + migration:
  - `eligibility`: `{ countries: string[] /* ISO alpha-2 */, regions: ("AFRICA"|"SSA"|"NORTH_AFRICA"|"GLOBAL"|...)[], levels: ("highschool"|"undergraduate"|"postgraduate"|"phd"|"professional")[], fields: string[], genders?: string[], ageMin?: number, ageMax?: number, notes?: string }`
  - `funding`: `{ type: "full"|"partial"|"stipend"|"none"|"unknown", amountText?: string, currency?: string }`
  - `status`: `"open"|"upcoming"|"closed"|"rolling"|"unknown"` (computed + overridable) and `cycle`: `{ year?: number, opensAt?: Date, closesAt?: Date|null, recurrence?: "annual"|"biannual"|"rolling"|"one-off", nextExpectedWindow?: string }`
  - `deadlineNote` (e.g. "11:59pm GMT") and `timezone`; store deadlines as an instant plus the note, display in the programme's timezone and the student's.
  - Provenance/verification: `source: { type: "official"|"aggregator"|"community"|"admin", url?: string }`, `verifiedAt`, `verifiedBy`, `confidence: "high"|"medium"|"low"`, `lastLinkCheck: { at, status, httpCode }`, `needsReview: boolean`.
  - Keep legacy `countries` and `deadline` readable; the migration populates the new fields and logs rows it could not map (to an admin "needs attention" list). Country mapping uses a maintained table in `lib/domain/countries.ts` (ISO codes, names, regional groups, "All African Countries" → region `AFRICA`).
- **S1.2 (P0) Status engine.** `lib/domain/status.ts`: derive `open/upcoming/closed/rolling` from the cycle and now; recurring programmes show "Closed — usually reopens ~<month>" instead of vanishing. Unit-test every branch, including deadlines at timezone boundaries.
- **S1.3 (P0) Listing rules (BUG-7).** Public lists exclude `closed` by default (toggle "Show closed"), sort by `closesAt` ascending for open items, then recency. Closed detail pages remain indexable but replace "Apply Now" with the closed/reopens state and similar open alternatives.
- **S1.4 (P0) Trust UI.** On every listing and benefit show "Verified <relative date> by <source>", the source link, a **Report outdated** button (feeds Sprint 2's queue), and a plain confidence label. Stale threshold (default 45 days) renders a visible "may be outdated" state.
- **S1.5 (P1) Benefit schema v2 (PROD-7).** `availability: { countries: Record<ISO, "works"|"partial"|"blocked"|"unknown">, notes?: string }`, `verificationMethod` (school email / document / ID), `paymentNotes`, `lastChecked`. Tool schema gains `freeTier` description and `studentOffer` flag.
- **S1.6 (P1) Seed expansion plan.** Do not invent entries. Create `docs/CONTENT_SOP.md`: how a listing is verified from the official page, required fields, review checklist, weekly cadence, target coverage across all seven categories (Internship, Hackathon and Program currently have zero entries). Ship a CSV import template for the owner to fill, plus an importer that validates and creates **drafts**.

**Acceptance:** migration dry-run report is clean or lists unmappable rows; `?country=NG` returns Nigeria-eligible and Africa-wide items; closed items never appear as "Apply Now"; tests cover the status engine.

---

### Sprint 2 — Admin dashboard and review queue

Goal: operate the product without touching the database.

- **S2.1 (P0) Admin shell** at `/admin`, behind `requireAdmin()`: tiles for drafts awaiting review, reports to moderate, outdated flags, broken links, listings closing in 7 days, listings not verified in 45 days, newsletter count.
- **S2.2 (P0) CRUD for opportunities, benefits, tools, guides** with the Zod schemas, slug generation/uniqueness, Markdown preview for guides, image upload component (now admin-gated), publish/unpublish, feature toggle, duplicate detection warning, and **revalidate the affected public pages on save** (on-demand revalidation).
- **S2.3 (P0) Review queue** shared by scrapers, student suggestions and "report outdated" flags: diff view (what changed vs the live record), approve / edit / reject with reason, bulk actions, keyboard shortcuts for speed.
- **S2.4 (P0) Verification workflow.** One-click "Mark verified now" that records admin, time and the source URL; bulk "re-verify" list sorted by oldest.
- **S2.5 (P1) Audit log.** Append-only `audit_log` of who changed what (field-level diff), shown per record.
- **S2.6 (P1) Report moderation** with the schema from Sprint 7 (can ship a minimal version first).
- **S2.7 (P2) Roles.** `admin` and `editor` (editors cannot delete or change settings).

**Acceptance:** an editor can create, verify, publish and unpublish a listing from the UI; every mutating admin route rejects non-admins; public pages update without a redeploy.

---

### Sprint 3 — Ingestion that helps instead of creating work

Goal: a steady, reviewable stream of accurate drafts, never overwriting editorial decisions.

- **S3.1 (P0) Fix the upsert semantics (BUG-9).** Scraped data uses `$set` only for scraper-owned fields; `published`, `featured`, `verified*` and any admin-edited field are `$setOnInsert` or protected by a per-field `editedByAdmin` flag. Re-running never unpublishes. Add a regression test with a published, edited record.
- **S3.2 (P0) Provenance and change detection.** Each draft stores `source`, `sourceUrl`, `sourceHash`, `firstSeenAt`, `lastSeenAt`. If the official page content hash changes for an existing record, create a **review item** ("listing may have changed") instead of silently updating.
- **S3.3 (P0) Prefer feeds/APIs over selectors.** For WordPress-based aggregators use RSS or the WordPress REST API (verify availability per site) before HTML selectors. Check and cache `robots.txt`; honour crawl delays; send the identifying User-Agent already in `http.ts`; cap requests per run.
- **S3.4 (P0) Resolve to the official page (BUG-10).** For each aggregator item, follow it to the programme's official link, store that as `officialLink`, keep the aggregator URL only as `source.url`. Reject items with no resolvable official link.
- **S3.5 (P1) Structured extraction with validation.** Optional Groq call that reads the official page text and returns JSON (`deadline`, `eligibility`, `funding`, `requirements`, `steps`) validated by Zod. Anything the model is not sure of stays `null`; set `needsReview=true` and `confidence="low"`. Never publish automatically. Cache by content hash to protect free-tier limits. Wrap page text in clear delimiters and ignore instructions found inside it.
- **S3.6 (P1) Own words, not copied text.** Store a short original summary (admin-edited) plus bullet facts; do not republish aggregator paragraphs.
- **S3.7 (P1) Dedupe.** Normalised title + organisation + cycle year fingerprint; fuzzy match with a conservative threshold; merge candidates go to the review queue.
- **S3.8 (P0) Link checker job.** Weekly (daily for items closing soon): HEAD then GET fallback, follow redirects, record `lastLinkCheck`; three consecutive failures flag the listing and notify admin.
- **S3.9 (P0) Scheduling and visibility.** GitHub Actions cron for each source and the link checker; each run writes an `ingest_runs` document (counts, errors, new drafts) shown in the admin; a short summary is sent to the owner (Telegram bot or email, both free to send).
- **S3.10 (P1) Remove or finish the placeholders.** Delete `student-offers.ts` and the template `example.com` sources unless a real source is added; keep one or two well-maintained sources (as `PROJECT_STATUS.md` itself recommends). Fix the GitHub Student Pack scraper's 403 by checking whether the page needs different headers or is JS-rendered; if so, move that source to a headless-browser job in Actions or drop automated scraping and maintain it manually.

**Acceptance:** scheduled runs produce drafts with official links and provenance; a re-run never changes `published`; broken links appear in the admin within a week; no copied aggregator paragraphs in the database.

---

### Sprint 4 — Search and discovery

Goal: find the right thing in seconds, on a phone.

- **S4.1 (P0) Search engine.** Create the Atlas Search index (`scripts/atlas-search-index.json` plus setup instructions) with a **compound query** (text over title, description, organisation, tags; filters on published, status, countries, levels, funding), fuzzy matching and autocomplete. Fallback to a Mongo **text index** with escaped input when Atlas Search is unavailable. Return `total` and pagination meta in both paths (BUG-8).
- **S4.2 (P0) Facets and URL state.** Filters: category, country (default from the visitor's saved profile or timezone guess, always changeable), level, field, funding type, deadline window (this week/month/quarter), status. Debounced search-as-you-type, shareable URLs, sticky filter bar on mobile, persistent "Clear all".
- **S4.3 (P0) Closing soon and New this week** pages and homepage sections, based on the status engine.
- **S4.4 (P1) Calendar export.** Per-listing and "my saved" `.ics` downloads (deadline plus 7/3/1-day alarms).
- **S4.5 (P1) Programmatic landing pages.** `/opportunities/country/[code]`, `/opportunities/category/[category]`, `/opportunities/level/[level]`, `/deadlines/[yyyy-mm]`, each with real server-rendered content, unique titles/descriptions, and links to related items. Generate with ISR; do not create empty pages (404 or `noindex` when there are no items).
- **S4.6 (P1) Related items** on detail pages (same category/country/field) and "closed? try these open ones".
- **S4.7 (P2) Recent searches and saved filters** for signed-in students.

**Acceptance:** a Nigerian postgraduate can reach open, relevant scholarships in two taps; zero-result queries are recorded (Sprint 8) and show helpful suggestions; search works with and without Atlas Search.

---
### Sprint 5 — AI Finder v2 (accurate, cheap, safe)

Goal: deterministic eligibility does the filtering; the model only ranks and explains a short list.

- **S5.1 (P0) Deterministic pre-filter (PROD-3).** `lib/finder/filter.ts`: from the student's profile keep only items that are open or upcoming, eligible for their country/region, match their level, and (when specified) their field. Missing eligibility data lowers a score and is shown as "check eligibility", it does not silently exclude or include.
- **S5.2 (P0) Scoring.** `lib/finder/score.ts` combines field/interest overlap (keyword + tag match), deadline proximity, funding type, confidence/verification freshness, and category preference. Take the top ~30 candidates. This alone must produce a sensible no-AI result.
- **S5.3 (P0) Compact, delimited LLM call.** Send only id, title, category, deadline, one-line summary, funding, and eligibility facts (never full descriptions). Put the student's free text inside explicit delimiters and instruct the model to treat it as data (SEC-5). Ask for `{ picks: [{ id, reason }], explanation }`. Use `response_format: json_object` and **validate with Zod**; drop unknown ids, enforce maximum counts, and cap reason length.
- **S5.4 (P0) Keep the reasons.** Surface each pick's reason and the matched criteria ("Open to Nigeria, postgraduate, closes 12 Nov"). Show how many items were considered.
- **S5.5 (P0) Graceful fallback.** If Groq is missing, rate-limited or returns invalid JSON, return the deterministic ranking with a clear "AI explanations unavailable right now" note. Never 500 because the model failed.
- **S5.6 (P0) Rate limit + cache.** Rate limit per IP (S0.3) and cache results by a hash of the normalised profile in `finder_cache` (short TTL) to protect the free tier.
- **S5.7 (P1) Share and save.** Shareable result link (signed id, expires), "save these" for signed-in students, email-me-this (rate-limited, via the email adapter).
- **S5.8 (P1) Better input UX.** Country and course as typeahead lists (keeps data clean), level chips, optional "what I already have" (CV, essay, referees) to tailor next steps.
- **S5.9 (P1) Evaluation harness.** `tests/finder/` with ~20 golden student profiles and a stub LLM; assert the pre-filter never returns ineligible or closed items, outputs validate, and results are stable. Record before/after notes in the log.
- **S5.10 (P1) Demand log.** Store anonymised finder inputs (country, level, interests, no free text identifiers) in `events` to reveal content gaps for the admin dashboard.

**Acceptance:** with the model disabled the Finder still returns a useful, correct list; with it enabled each result shows a grounded reason; no request sends more than the compact candidate set; prompt-injection test strings do not alter output structure.

---

### Sprint 6 — Student accounts-lite and retention

Goal: give students a reason to come back, with minimal friction and minimal personal data.

- **S6.1 (P0) Student sign-in.** Auth.js with Google and/or an email magic link; roles `student` vs `admin` kept separate. Collect only what is needed (email, optional country, level, fields). Account page with **export my data** and **delete my account**.
- **S6.2 (P0) Save and track.** Heart/bookmark on cards and detail pages; `/saved` page; an **application tracker** with stages (Saved → Preparing → Submitted → Result) and notes per item. Works for anonymous visitors via local storage that merges into the account on sign-in.
- **S6.3 (P0) Deadline reminders.** Daily GitHub Actions job finds saved/tracked items closing in 7, 3 and 1 days and sends one consolidated email per student per day. Idempotent (`reminders_sent` collection), respects quiet unsubscribes, and never reminds for closed items.
- **S6.4 (P0) Newsletter done properly (BUG-11).** Lower-case and validate emails; unique index; **double opt-in** confirmation link; **unsubscribe** link in every email plus a preferences page; a provider adapter in `lib/email/` (Sendhiiv implementation behind it). Resolve the Sendhiiv audience question by testing the real endpoint from the owner's dashboard; if unavailable, send the digest in batches through the transactional endpoint or swap the adapter for another free-tier provider. Welcome email is sent with `after()` so the request is fast.
- **S6.5 (P1) Weekly digest generator.** Script that builds a draft digest: top closing soon, new this week, one guide, and personalised sections for signed-in subscribers; the admin previews and approves before sending.
- **S6.6 (P1) "For you" feed** on the homepage/account using the saved profile and the Sprint 5 filter/score modules (no LLM required).
- **S6.7 (P1) Consent and privacy.** Store consent timestamp and purpose; privacy page explains data, retention, and deletion; log data-deletion requests.
- **S6.8 (P2) Telegram/WhatsApp-friendly sharing** of saved lists (text summary with links).

**Acceptance:** a student can sign in, save three items, see them in the tracker, and receive one consolidated reminder email; unsubscribe works in one click; the double opt-in flow records confirmation.

---

### Sprint 7 — Community reports and benefit intelligence (the African edge)

Goal: tell students whether a perk really works for people like them.

- **S7.1 (P0) Report schema v2 (BUG-3, BUG-4, SEC-6).** Separate `outcome` (`worked`|`partial`|`failed`) from `moderation` (`pending`|`approved`|`rejected`). Link by `benefitId` chosen from a **select/typeahead** of real benefits (server resolves the title; never trust client titles). Add structured fields: country, school (typeahead of already-seen schools), `verificationMethod`, `timeToApproveDays`, `paymentIssue` (yes/no/notes), `date`. Migrate old reports (`status` meaning is ambiguous: treat existing `approved` rows as moderation, outcome `unknown`).
- **S7.2 (P0) Anti-spam.** Honeypot field, time-to-submit check, rate limit, optional Cloudflare Turnstile (free), duplicate-text detection, link stripping in comments, manual moderation.
- **S7.3 (P0) Aggregates with honesty.** On each benefit show success rate overall and by country only when `n ≥ 5` (otherwise "not enough reports yet"), weighted toward recent reports (e.g. last 12 months), with counts visible. Update the About copy to match reality.
- **S7.4 (P1) Availability matrix.** Use reports plus admin notes to populate `availability[country]` (works/partial/blocked/unknown) and show "Does this work in my country?" at the top of each benefit page, with last-updated date.
- **S7.5 (P1) Practical guidance fields.** Documents typically accepted, school-email requirements, virtual dollar card or payment workarounds, common rejection reasons; moderated community tips with helpful votes.
- **S7.6 (P1) Moderation UI** inside the admin review queue with approve/reject/edit and a reason that can be emailed back to the submitter.
- **S7.7 (P2) Public suggestion form** for new opportunities/benefits (from the contact page) that feeds the same review queue.

**Acceptance:** a student submits a report by choosing a benefit and outcome; moderated reports update country-level success rates only above the minimum sample; spam attempts are rejected.

---

### Sprint 8 — SEO, growth, analytics and performance

Goal: be found, shared, measured, and fast on weak connections.

- **S8.1 (P0) SEO plumbing (BUG-12).** `app/sitemap.ts` (all published items plus landing pages), `app/robots.ts`, canonical URLs, per-page metadata, **JSON-LD** (`BreadcrumbList`, `ItemList`, `Article` for guides, `FAQPage` where real FAQs exist; verify schema.org types before use), dynamic OG images via `next/og`, `rss.xml` for new opportunities.
- **S8.2 (P0) Rendering strategy.** Public pages use ISR with sensible `revalidate` plus on-demand revalidation from the admin (Sprint 2); detail pages use `generateStaticParams` for published slugs; avoid client-side data fetching for first paint.
- **S8.3 (P0) Outbound tracking.** `/go/[slug]` logs the click (listing, source page, no personal data) then redirects (with `rel` and safe URL validation; never an open redirect). Use it for every "Apply Now" and official link.
- **S8.4 (P0) First-party analytics.** `events` collection with TTL (page-type views, searches with result counts, zero-result queries, finder runs, saves, outbound clicks, report submissions). Admin "Insights" page: top zero-result queries, most-clicked listings, drop-offs, content gaps. No third-party trackers by default; if an analytics service is added, document consent.
- **S8.5 (P1) Growth loops.** Share buttons (WhatsApp, Telegram, X, copy link) with prefilled text; a Telegram channel auto-post for newly published opportunities and 3-day-to-deadline alerts via the Bot API (free); "Closing this week" public page designed for screenshots.
- **S8.6 (P1) Performance budget.** Measure on throttled mid-range Android: keep the main routes lean (server components by default; client JS only where needed), serve images through Cloudinary transformations (`f_auto`, `q_auto`, responsive widths) and `next/image` with proper `sizes`, reduce font weights and subsets, avoid layout shift, preload only what matters. Record Lighthouse/Web Vitals before and after in `docs/IMPROVEMENT_REPORT.md`.
- **S8.7 (P1) PWA lite.** Web manifest plus an offline-capable shell and cached "Saved" list so students can check deadlines with no data.
- **S8.8 (P2) Language support.** Begin with French for the main journeys (Francophone Africa) using `next-intl`; keep listings in their source language with translated UI and filters.
- **S8.9 (P2) Responsible monetisation.** If sponsorship is ever added: clearly labelled slots, never influence Finder ranking or verification, written editorial policy. Document the policy even if nothing ships.

**Acceptance:** sitemap and robots resolve; structured data validates; analytics show searches, zero-results and outbound clicks; Lighthouse mobile performance improves versus the recorded baseline.

---

### Sprint 9 — Quality gates, docs, release

- **S9.1 (P0) Tests.** Unit tests for utils, safe-query parsing, status engine, eligibility filter, scoring, Zod schemas, upsert protection, rate limiter. Integration tests for API routes with an in-memory or test Mongo. Playwright for: browse and filter, finder with LLM stubbed, save and reminder opt-in, report submission, admin login guard.
- **S9.2 (P0) CI.** GitHub Actions on every PR: lint, typecheck, tests, build, ensure-indexes dry-run; nightly job for link checks and stale-listing report with a failing status if thresholds are breached.
- **S9.3 (P0) Docs.** Replace `PROJECT_STATUS.md` with accurate `README.md` (setup, env vars, architecture, jobs, how to add content), `docs/RUNBOOK.md` (restore from backup, rotate secrets, rerun jobs, handle a bad scrape, remove a listing fast), `docs/CONTENT_SOP.md`, `docs/PRIVACY_NOTES.md` (data inventory, retention, deletion).
- **S9.4 (P1) Observability.** Structured error logging with request ids; a lightweight `/api/health` (DB ping, last ingest run, last reminder run); alert on failed scheduled jobs.
- **S9.5 (P1) Final report** `docs/IMPROVEMENT_REPORT.md`: before/after on the verified findings, metrics from section 1, performance numbers, content coverage, and anything deferred with reasons.

---

## 6. Content operations (the product is the data)

Code alone will not make this valuable. Alongside the engineering work, produce:

- A **source list** of official programme pages and trusted aggregators with notes on feed/API availability and licence/ToS considerations.
- A **weekly rhythm** (for example: ingest drafts, review and verify, publish, send digest, re-verify oldest 20) that the admin dashboard supports directly.
- **Coverage targets** across all seven categories and across at least the largest student populations (Nigeria, Kenya, Ghana, South Africa, Egypt, Ethiopia, Uganda, Tanzania, Cameroon, Senegal). Treat the numbers as goals to review with the owner, not facts.
- A **contributor path** for students and campus ambassadors via the suggestion form, with attribution and moderation.

## 7. Global definition of done

- Only admins can publish, edit, upload or moderate; no endpoint is abusable for quota burning; inputs are escaped and bounded.
- `next build` and the app boot without every secret; AI and email degrade gracefully.
- Every public listing shows status, last-verified date and source; closed items never present an active "Apply Now".
- Search and filters (including country) work and are fast on mobile; closing-soon and country pages exist and are indexable.
- The Finder gives correct, eligible, explained results even when the LLM is down, within free-tier limits.
- Students can save items, track applications and receive consolidated deadline reminders; newsletter has double opt-in and unsubscribe.
- Community reports store outcome separately from moderation and only show statistics above a minimum sample.
- Ingestion is scheduled, provenance-aware, never overwrites editorial decisions, and feeds a review queue.
- Tests and CI are green; docs, runbook, content SOP and the improvement report are written.
- Everything still runs on free or near-free tiers.

## 8. First actions (do these now)

1. Read the repo and re-confirm every **[read]** item in section 3 with a failing test or script; note any that no longer reproduce.
2. Record baselines: Lighthouse mobile scores for `/`, `/opportunities` and a detail page; bundle size; current counts of published items per category; how many listings have a past deadline or `deadline: null`.
3. Start Sprint 0. Commit after each task group and report back with what changed and what you measured before moving to Sprint 1.
