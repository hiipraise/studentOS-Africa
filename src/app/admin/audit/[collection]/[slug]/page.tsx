import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/authz";
import { Collections, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
const allowed = new Set<string>([Collections.opportunities, Collections.benefits, Collections.tools, Collections.guides, Collections.reports]);
export default async function RecordAuditPage({ params }: { params: Promise<{ collection: string; slug: string }> }) {
  await requireEditor(); const { collection, slug } = await params;
  if (!allowed.has(collection)) notFound();
  const rows = await (await getDb()).collection(Collections.auditLog).find({ collection, slug }).sort({ createdAt: -1 }).limit(100).toArray();
  return <section><h1 className="text-2xl font-bold">Audit history</h1><p className="mb-6 text-sm text-muted">{collection} / {slug}</p><ol className="space-y-3">{rows.map(row => <li key={row._id.toString()} className="rounded-xl border bg-white p-4"><p className="text-sm text-muted">{row.createdAt?.toISOString?.() ?? ""} · {String(row.actor)}</p><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(row.changes, null, 2)}</pre></li>)}{!rows.length && <li className="rounded-xl border bg-white p-5">No changes have been recorded yet.</li>}</ol></section>;
}
