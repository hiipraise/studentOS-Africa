import { requireAdmin } from "@/lib/authz";
import { getDb, Collections } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function NeedsAttentionPage() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.collection(Collections.needsAttention).find({ resolved: { $ne: true } }).sort({ createdAt: -1 }).limit(200).toArray();
  return <div><h1 className="text-2xl font-bold mb-2">Needs attention</h1><p className="text-sm text-muted mb-6">Unmapped legacy eligibility and student reports are listed for editorial review.</p>{rows.length ? <ul className="space-y-3">{rows.map((row) => <li key={row._id.toString()} className="rounded-lg border p-4"><p className="font-medium">{String(row.title ?? row.sourceId)}</p><p className="text-sm text-muted">{String(row.kind)} · {Array.isArray(row.values) ? row.values.join(", ") : "Review reported by a student"}</p></li>)}</ul> : <p>No unresolved items.</p>}</div>;
}
