# Deployment setup

Set `MONGODB_URI`, optional `MONGODB_DB` (defaults to `studentos`), `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and a comma-separated `ADMIN_EMAILS` allowlist in the hosting environment. Groq, Cloudinary, and email credentials are optional; features that need missing credentials should remain unavailable without stopping the site from building.

Before the first production release, take an Atlas backup with `mongodump`. Run `npm run ensure-indexes` from a deployment job with the production MongoDB variables after backup and before serving the release. It is safe to rerun. It may report duplicate existing slugs or email addresses when a unique index is first created; resolve those records deliberately before retrying.

Before migrating opportunity records, export the Atlas database with `mongodump`. Run `npm run migrate:opportunities-v2 -- --dry-run` and review its unmapped-country report. Apply the idempotent additive migration with `npm run migrate:opportunities-v2 -- --apply`; unmapped country strings are retained in legacy fields and added to `/admin/needs-attention` for review.

The GitHub Actions CI workflow runs the same index script against a disposable MongoDB service. Do not put production database credentials in build logs or use the production database for CI.
