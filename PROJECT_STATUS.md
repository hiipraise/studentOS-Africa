
# StudentOS Africa — Project Status

Last updated: July 18, 2026

This document is an honest snapshot of what's actually built, verified, and working — versus what's stubbed, assumed, or not started at all. Read this before you assume something works.

**Verification performed before this doc was written:** full `npm install` on a clean local disk, `tsc --noEmit` (zero errors), `next lint` (zero warnings), `next build` (succeeded up to font fetching — fonts.googleapis.com isn't reachable from the sandbox this was built in, but that's a network restriction of the build environment, not your machine), and live execution of `scripts/seed.ts` and `scripts/scrapers/run.ts --dry-run` (both run cleanly; the dry-run scraper test against GitHub's real pack page returned a live HTTP 403, confirming the scraper code path works end-to-end even though the target site blocked the request).

*Updated July 18, 2026 — No code changes since the previous update. Project is in the same state as June 20 (single initial commit, working tree clean).*

---

## ✅ Built and verified

### Core app

- All 8 product module pages: Opportunities, Benefits, Tools, Guides, Community Reports, AI Finder, Newsletter, Homepage
- Full data layer: MongoDB native driver, Zod schemas, server-side data fetchers for every collection
- All API routes from the PRD, plus `/api/newsletter` and `/api/upload`
- Design system: Tailwind tokens, two-font system (Plus Jakarta Sans + Instrument Serif), shared component library
- AI Finder wired to Groq (`llama-3.3-70b-versatile`)
- Sendhiiv integration for the one confirmed endpoint (`POST /v1/messages` — transactional welcome email). MongoDB is the source of truth for subscribers.
- Cloudinary upload flow: `/api/upload` route + `ImageUpload` drag-and-drop component, both type-checked and ready to use in admin forms once those exist
- Seed data: 6 opportunities, 8 benefits, 13 tools, 5 guides — all real, web-verified content (sourcing notes below)
- Scraper pipeline architecture (Extract → Validate → Normalize → Store) with 4 source modules, CLI runner, dry-run mode

### What "verified" actually means here

TypeScript compiles, lint is clean, the production build pipeline runs (modulo the sandbox's font-fetch network restriction), and the seed/scraper scripts execute without import or runtime errors. It does **not** mean every page has been visually checked in a browser, or that the scrapers successfully extract data from live sites (see below).

---

## ⚠️ Built but needs your attention

### Scrapers — code is real, selectors are not verified

All 4 scrapers (`github-student-pack`, `scholarship-sites`, `ai-tool-directories`, `student-offers`) are fully wired into the pipeline and run cleanly. But:

- **GitHub Student Pack scraper** hit a live HTTP 403 when dry-run tested against `education.github.com/pack` during verification. The page may need browser-like headers, may be partly JS-rendered (in which case you'd need Playwright/Puppeteer instead of a plain fetch), or may simply block this sandbox's IP. Needs real debugging from your machine.
- **`scholarship-sites.ts` and `ai-tool-directories.ts`** ship with a placeholder `example.com` source and template CSS selectors — you must add real target URLs and selectors before these do anything.
- **`student-offers.ts`** — I could not confirm what specific site "StudentOffers" refers to (no canonical product by that name turned up in research). Built as the same configurable pattern; you'll need to tell it which real site you mean.
- All scraped content is stored with `published: false` by design — nothing goes live without manual review, since wrong deadlines or dead links directly hurt students relying on this site.

### Sendhiiv — partially wired

The confirmed transactional email endpoint works. There is **no confirmed "add to audience" endpoint** in Sendhiiv's docs for ongoing campaign sends — `addToSendhiivAudience()` in `src/lib/sendhiiv.ts` is a clearly-marked no-op stub. Find the real endpoint in your Sendhiiv dashboard and wire it in there; it's isolated to that one function.

### Seed data — intentionally smaller than it could be

6 opportunities, not 20+. I chose accuracy over volume: every entry is a real, currently-operating program (Mastercard Foundation Scholars, Chevening, Tony Elumelu Foundation, Mandela Washington Fellowship/YALI, DAAD, Resolution Project) with a verified official link. Categories **Internship, Hackathon, and Program have zero seeded examples** — I didn't have a verified-current listing for those categories and chose not to guess. Several opportunities have `deadline: null` rather than a fabricated date, because the real program runs on a recurring annual window rather than one confirmed next date.

---

## ❌ Not built at all

- **Admin Dashboard** — no UI exists for managing any collection. Right now the only way to add/edit content is editing MongoDB directly or running the seed script.
- **Auth.js / admin login** — zero implementation. No login page, no session handling, no route protection. `/api/upload` and the eventual admin CRUD routes are **completely unprotected** right now — anyone with the URL could call them.
- **MongoDB Atlas Search index** — the opportunities search route has a regex fallback, but the real Atlas Search index (better relevance, typo tolerance) doesn't exist in your cluster yet. You need to create it manually in the Atlas dashboard.
- **Any automated/scheduled scraper runs** — the scrapers are CLI scripts you run manually (`npm run scrape:all`). No cron job, no Vercel Cron config, no queue.
- **Tests** — zero automated tests of any kind (unit, integration, e2e).
- **Image optimization/CDN config beyond the basics** — Cloudinary upload works, but there's no image transformation presets beyond the one size cap in `uploadToCloudinary()`.

---

## 🔧 Recommended next steps, in order

1. **Run `npm install` locally**, then `npm run seed` against your real MongoDB Atlas cluster to get real content live.
2. **Build the Admin Dashboard + Auth.js** — this is the biggest functional gap. Without it, you cannot safely operate this product; every content change requires direct database access.
3. **Lock down `/api/upload`** the moment Auth.js exists — it's an open upload endpoint right now.
4. **Debug the GitHub Student Pack scraper from your own machine** — the 403 needs investigation with real browser dev tools open against the live page.
5. **Fill in real selectors** for `scholarship-sites.ts` and `ai-tool-directories.ts`, and clarify what "StudentOffers" should target.
6. **Create the MongoDB Atlas Search index** for opportunities once you have enough seeded data to make search relevance meaningful.
7. **Resolve the Sendhiiv audience endpoint** so the newsletter actually sends ongoing campaigns, not just the one welcome email.

---

## 💡 Features worth considering adding

- **Saved/bookmarked opportunities** for logged-in students (requires user accounts beyond admin-only auth — a bigger architectural decision)
- **Deadline reminder emails** — you already collect deadlines and have Sendhiiv wired for transactional sends; a "closing in 3 days" email is a small lift from here
- **Country-specific landing pages** (`/opportunities/nigeria`, `/opportunities/kenya`) for better SEO — the data model already supports filtering by country
- **A public submission form** for students to suggest opportunities/benefits (separate from the existing Community Reports flow), feeding into the same `published: false` review queue as the scrapers

## 🗑️ Features worth reconsidering

- **The `admins` MongoDB collection vs. Auth.js's own user storage** — decide now whether admin accounts live in your own collection (current schema assumes this) or whether you'll let an Auth.js adapter manage that table, since switching later means a migration
- **Scraper scope** — four scraper sources is a lot of ongoing maintenance (selectors break whenever a target site redesigns). Consider whether 1-2 well-maintained sources beat 4 fragile ones, at least initially
