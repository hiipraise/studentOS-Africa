import Link from "next/link";
import { ArrowLeft, Search, MousePointerClick, Sparkles, Bookmark, Flag } from "lucide-react";
import { getDb, Collections } from "@/lib/db";
import { requireEditor } from "@/lib/authz";

export const dynamic = "force-dynamic";

interface TopRow {
  _id: string;
  count: number;
  resultCount?: number;
}

export default async function AdminInsightsPage() {
  await requireEditor();
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 86400000);
  const events = db.collection(Collections.events);

  const [totals, zeroQueries, clicked, engines, lastIngest] = await Promise.all([
    events.aggregate<{ _id: string; count: number }>([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$type", count: { $sum: 1 } } }]).toArray(),
    events
      .aggregate<TopRow>([
        { $match: { type: "zero_result", createdAt: { $gte: since }, query: { $type: "string" } } },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ])
      .toArray(),
    events
      .aggregate<TopRow>([
        { $match: { type: "outbound_click", createdAt: { $gte: since }, slug: { $type: "string" } } },
        { $group: { _id: "$slug", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ])
      .toArray(),
    events.aggregate<TopRow>([{ $match: { type: "search", createdAt: { $gte: since } } }, { $group: { _id: { $ifNull: ["$engine", "unknown"] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    db.collection(Collections.ingestRuns).findOne({ source: "all" }, { sort: { startedAt: -1 } }),
  ]);

  const count = (type: string) => totals.find((row) => row._id === type)?.count ?? 0;
  const searches = count("search");
  const zeroResults = count("zero_result");
  const zeroRate = searches > 0 ? Math.round((zeroResults / searches) * 100) : 0;
  const maxClicked = Math.max(1, ...clicked.map((row) => row.count));
  const totalEvents = totals.reduce((sum, row) => sum + row.count, 0);

  const cards = [
    { label: "Searches", value: searches, icon: Search, detail: `${zeroRate}% returned nothing` },
    { label: "Outbound clicks", value: count("outbound_click"), icon: MousePointerClick, detail: "Apply / claim buttons" },
    { label: "Finder runs", value: count("finder_run"), icon: Sparkles, detail: "AI or deterministic" },
    { label: "Saves", value: count("save"), icon: Bookmark, detail: "Signed-in and anonymous merges" },
    { label: "Reports submitted", value: count("report_submitted"), icon: Flag, detail: "Before moderation" },
  ];

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-ink">Insights</h1>
      <p className="mb-6 text-sm text-muted">
        First-party, privacy-light events from the last 30 days ({totalEvents.toLocaleString()} events). No third-party trackers.
        {lastIngest?.startedAt ? ` Last ingestion run: ${new Date(lastIngest.startedAt).toLocaleString("en-GB")} (${String(lastIngest.status)}).` : " No ingestion run recorded yet."}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, detail }) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <Icon className="mb-2 h-4 w-4 text-forest" aria-hidden="true" />
            <p className="text-2xl font-bold tabular-nums text-ink">{value.toLocaleString()}</p>
            <p className="text-xs font-medium text-ink">{label}</p>
            <p className="mt-0.5 text-xs text-muted">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-ink">Top zero-result queries</h2>
          <p className="mb-4 text-xs text-muted">Content gaps: what students looked for and did not find.</p>
          {zeroQueries.length === 0 ? (
            <p className="text-sm text-muted">No zero-result searches recorded.</p>
          ) : (
            <ul className="space-y-2">
              {zeroQueries.map((row) => (
                <li key={row._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{row._id}</span>
                  <span className="shrink-0 tabular-nums text-muted">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-ink">Most-clicked listings</h2>
          <p className="mb-4 text-xs text-muted">Outbound clicks through /go, per listing.</p>
          {clicked.length === 0 ? (
            <p className="text-sm text-muted">No outbound clicks recorded.</p>
          ) : (
            <ul className="space-y-3">
              {clicked.map((row) => (
                <li key={row._id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{row._id}</span>
                    <span className="shrink-0 tabular-nums text-muted">{row.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage">
                    <div className="h-full rounded-full bg-forest" style={{ width: `${Math.round((row.count / maxClicked) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-ink">Search engine health</h2>
          <p className="mb-4 text-xs text-muted">
            Atlas is the preferred engine. Text or regex means the fallback is doing the work — see docs/SEARCH_SETUP.md.
          </p>
          {engines.length === 0 ? (
            <p className="text-sm text-muted">No search events recorded.</p>
          ) : (
            <ul className="space-y-2">
              {engines.map((row) => (
                <li key={row._id} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-ink">{row._id}</span>
                  <span className="tabular-nums text-muted">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-ink">Event mix</h2>
          <p className="mb-4 text-xs text-muted">Useful for spotting whether the loops (search → click → save) are working.</p>
          {totals.length === 0 ? (
            <p className="text-sm text-muted">No events recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...totals].sort((a, b) => b.count - a.count).map((row) => (
                <li key={row._id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{row._id.replaceAll("_", " ")}</span>
                  <span className="tabular-nums text-muted">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs text-muted">
        Events expire after 180 days automatically. Queries are truncated to 100 characters and contain no account identifiers.
      </p>
    </div>
  );
}
