# Search setup

StudentOS search works in three layers, in order:

1. **Atlas Search** (`opportunities_search`) — best relevance, fuzzy matching and facets.
2. **MongoDB text index** (`opportunities_text`) — created automatically by `npm run ensure-indexes`.
3. **Escaped regex fallback** — always works, slower, used when the database has no text index yet.

You only need to do this once per Atlas cluster.

## Create the Atlas Search index

1. Open Atlas → your cluster → **Atlas Search** (or **Search** in newer UIs).
2. Choose the `studentos` database and the `opportunities` collection.
3. Select **JSON editor** and paste the contents of `scripts/atlas-search-index.json`.
4. Set the index name to exactly `opportunities_search` and save.
5. Wait for the status to become **Active**, then open `/opportunities?q=nigeria`.

The app probes Atlas Search at runtime. If the index is missing, the cluster
does not support `$search` (for example a shared tier without Search), or the
index is still building, the app logs one warning and falls back to the text
index automatically. It never fails the page.

## What is indexed

| Field | Type | Used for |
|---|---|---|
| `title`, `description`, `organisation`, `tags`, `eligibility.fields` | string | free-text query and fuzzy matching |
| `category`, `status` | token | exact facet filters |
| `eligibility.countries`, `eligibility.regions`, `eligibility.levels` | token | country / region / study-level filters |
| `funding.type` | token | funding facet |
| `cycle.closesAt` | date | deadline window facet |
| `published`, `featured` | boolean | visibility filters |

## Cost

Atlas Search is available on M0/free clusters with limits on index count and
query rate. This design uses one index and short queries; if you outgrow the
free limits the text fallback keeps the site working.

## Verifying

```bash
# Should print "StudentOS indexes ensured."
npm run ensure-indexes
```

If search returns `engine: "atlas"` in the admin Insights page, the Atlas index
is live. `engine: "text"` or `"regex"` means the fallback is doing the work.
