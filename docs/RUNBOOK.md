# Runbook

Operational procedures for StudentOS Africa. Keep this file current whenever a
job, secret or collection changes.

## 1. Is it up?

- `GET /api/health` returns `200` with `ok: true` when MongoDB responds. It
  returns `503` with `status: "degraded"` when the database is unreachable.
- The response also shows the latest `ingest_runs` rows for ingestion,
  reminders and stale listings. A job that has never run shows
  `"no run recorded"` rather than pretending to be healthy.
- The scheduled `stale` workflow curls the same endpoint after every run, so a
  failed probe appears in the Actions log.

## 2. Routine checks

| Cadence | Check |
|---|---|
| Daily | `/api/health`, ingestion run status, failed reminder count |
| Weekly | `/admin/insights` (zero-result searches, finder runs), link-check summary, review queue |
| Monthly | Stale listings, broken official links, newsletter bounces handled by the provider, dependency updates |

`ingest_runs` is the source of truth for job outcomes. Each run records its
source, status, counts and error strings; the admin dashboard reads the same
rows.

## 3. Restore the database

1. Stop scheduled workflows (disable `ingestion.yml`, `link-check.yml` and
   `jobs.yml` in GitHub Actions).
2. Take a fresh snapshot before changing anything, even during an incident.
3. Restore with `mongorestore --uri "$MONGODB_URI" --archive=backup.archive --gzip`
   (or the Atlas point-in-time restore UI).
4. Run `npm run ensure-indexes` against the restored database. Index creation
   is idempotent.
5. Re-enable workflows and trigger one manual run of each job.
6. Verify `/api/health`, `/opportunities`, `/reports` and `/admin`.

Do not run a restore into the production database without an explicit owner
decision; prefer restoring into a new database, checking counts, then cutting
over.

## 4. Rotate a secret

| Secret | Effect of rotation |
|---|---|
| `AUTH_SECRET` | Invalidates existing sessions and all signed links (newsletter confirmation, unsubscribe, finder shares, reminder links). Users must sign in again. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in fails until both values match the OAuth client. Admin access is still gated by `ADMIN_EMAILS`. |
| `MONGODB_URI` | Update hosting and GitHub Actions secrets together, then redeploy. |
| `GROQ_API_KEY` | Finder falls back to deterministic ranking; ingestion enrichment is skipped. No user-facing outage. |
| Email provider keys | Adapter falls through to the next provider, then to logging. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Only owner alerts and channel posts stop. |
| `TURNSTILE_SECRET` | Public forms accept submissions for manual moderation while the value is missing. |

After rotating `AUTH_SECRET`, send a short notice if a newsletter issue is due,
because unsubscribe links in already-delivered mail stop working. Re-subscribe
links can be regenerated from `/newsletter/preferences`.

## 5. Rerun a job

1. GitHub → Actions → the workflow → **Run workflow**.
2. For `jobs.yml`, choose `reminders`, `digest`, `telegram` or `stale`.
3. Watch the run summary; failures also write to `ingest_runs` where the job
   supports it.
4. For ingestion, use `npm run scrape:scholarships` locally with the production
   `MONGODB_URI` only if Actions is unavailable. Never run two ingestion jobs
   concurrently against the same database.

The digest job only builds a draft unless run with `--send`. Sending is a
deliberate manual step.

## 6. A bad scrape or a wrong listing

1. Open the listing in `/admin` and unpublish it immediately. Unpublishing is
   the fastest reversible action; it removes the page from public lists.
2. Add a note to `needs_attention` so the record is not silently republished.
3. Check whether the source extractor changed. Fix the selector or feed mapping
   in `scripts/scrapers/`, then run `npm run scrape -- --source=… --dry-run`.
4. Re-run against the database. Ingestion protects editorial fields and never
   unpublishes a record automatically.
5. If personal data was exposed, follow section 7.

## 7. Remove or correct personal data

- Reports may include an optional email and a school/country. Delete the report
  from `/admin/reports`; the public list reads approved rows only.
- Newsletter subscribers can be removed by deleting their row from `newsletter`.
  The provider may still hold a copy until its own retention window passes.
- Account records live in `users`, `saved_items` and `reminders_sent`. Delete by
  email in all three collections, then confirm the user cannot sign in to
  residual data.
- Analytics events contain no account identifiers and expire after 180 days.
  Removing an event is not required for a deletion request, but is possible.

Record the request, the action and the date. Do not copy personal data into
tickets or chat.

## 8. Provider outages

| Provider down | Expected behaviour |
|---|---|
| MongoDB | Public pages render empty states; `/api/health` is `503`; writes fail. Restore connectivity first. |
| Groq | Finder returns ranked deterministic results with a note. |
| Email provider | Confirmation and reminder mail is logged, not sent. Subscriptions remain `pending`. |
| Cloudinary | Admin image upload returns an error; existing images still load. |
| Turnstile | Submissions are accepted and queued for manual moderation. |
| Telegram | No alerts; nothing user-facing. |

## 9. Deploy checklist

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. Back up the database.
3. Run additive migrations with `--dry-run` first, then `--apply`.
4. Run `npm run ensure-indexes`.
5. Deploy, then check `/api/health` and one public page.
6. Keep the previous deployment available for rollback. Database migrations are
   additive, so an application rollback does not require a data rollback.
