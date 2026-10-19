import Link from "next/link";
import { requireEditor } from "@/lib/authz";
import { Collections, getDb } from "@/lib/db";
import { ReviewActions } from "./ReviewActions";
import { BulkReview } from "./BulkReview";

export const dynamic = "force-dynamic";
const kinds = ["opportunities", "benefits", "tools", "guides"] as const;
export default async function ReviewPage() {
  await requireEditor(); const db = await getDb();
  const [drafts, suggestions, flags] = await Promise.all([
    Promise.all(kinds.map(async (kind) => (await db.collection(kind).find({ published: false }).sort({ createdAt: 1 }).limit(100).toArray()).map((row) => ({ kind, row })))),
    db.collection(Collections.reviewQueue).find({ status: "pending" }).sort({ createdAt: 1 }).limit(100).toArray(),
    db.collection(Collections.needsAttention).find({ resolved: { $ne: true } }).sort({ createdAt: 1 }).limit(100).toArray(),
  ]);
  return <section><h1 className="text-2xl font-bold">Review queue</h1><p className="text-sm text-muted mb-6">Drafts, submitted suggestions and outdated reports. Keyboard: A approves; R rejects the current item.</p>
    <BulkReview ids={suggestions.map((row) => row._id.toString())} />
    <div className="space-y-4">{drafts.flat().map(({ kind, row }) => <article key={`${kind}-${row._id}`} className="rounded-xl border bg-white p-4"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase text-muted">Draft · {kind}</p><h2 className="font-semibold">{String(row.title ?? row.slug)}</h2><p className="text-sm text-muted">Current record is unpublished; review the listing then choose edit.</p><Link className="text-sm text-blue-700 underline" href={`/admin/${kind}/${row.slug}/edit`}>Edit draft</Link></div><form action={async () => { const { setPublished } = await import("../actions"); await setPublished(kind, String(row.slug), true); }}><button className="rounded bg-emerald-700 px-3 py-2 text-white">Approve and publish</button></form></div></article>)}
      {suggestions.map((row) => <article tabIndex={0} data-review-id={row._id.toString()} key={row._id.toString()} className="rounded-xl border bg-white p-4 focus:outline focus:outline-2 focus:outline-forest"><p className="text-xs uppercase text-muted">Suggestion · {String(row.entityType ?? "listing")}</p><h2 className="font-semibold">{String(row.payload?.title ?? "Suggested listing")}</h2>{row.targetSlug && <p className="my-1 text-sm text-muted">Proposed changes to <Link className="text-blue-700 underline" href={`/admin/${row.entityType}/${row.targetSlug}/edit`}>{String(row.targetSlug)}</Link></p>}<details className="my-2"><summary>Diff from live record</summary><pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify({ live: row.live ?? null, proposed: row.payload }, null, 2)}</pre></details><ReviewActions id={row._id.toString()} /></article>)}
      {flags.map((row) => <article key={row._id.toString()} className="rounded-xl border bg-white p-4"><p className="text-xs uppercase text-muted">Report outdated · {String(row.kind)}</p><h2 className="font-semibold">{String(row.title ?? row.sourceId)}</h2><p className="text-sm">{String(row.message ?? "A student flagged this record for review.")}</p><Link className="text-sm underline" href={`/admin/opportunities/${row.sourceId}/edit`}>Review listing</Link></article>)}
      {!drafts.flat().length && !suggestions.length && !flags.length && <p className="rounded-xl border bg-white p-8">Queue is clear.</p>}</div>
  </section>;
}
