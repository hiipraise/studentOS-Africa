import { requireEditor } from "@/lib/authz";
import { Collections, getDb } from "@/lib/db";
import { markVerified } from "../actions";

export const dynamic = "force-dynamic";
export default async function VerificationPage() {
  await requireEditor(); const db = await getDb(); const cutoff = new Date(Date.now() - 45 * 86400000);
  const [opportunities, benefits] = await Promise.all([
    db.collection(Collections.opportunities).find({ published: true, $or: [{ verifiedAt: { $lt: cutoff } }, { verifiedAt: { $exists: false } }] }).sort({ verifiedAt: 1, createdAt: 1 }).limit(100).toArray(),
    db.collection(Collections.benefits).find({ published: true, $or: [{ lastChecked: { $lt: cutoff } }, { lastChecked: { $exists: false } }] }).sort({ lastChecked: 1, createdAt: 1 }).limit(100).toArray(),
  ]);
  const rows = [...opportunities.map((row) => ({ kind: "opportunities" as const, row, checked: row.verifiedAt })), ...benefits.map((row) => ({ kind: "benefits" as const, row, checked: row.lastChecked }))].sort((a,b) => (a.checked?.getTime() ?? 0) - (b.checked?.getTime() ?? 0));
  return <section><h1 className="text-2xl font-bold mb-2">Verification</h1><p className="text-sm text-muted mb-6">Oldest unchecked published listings first.</p><div className="space-y-3">{rows.map(({kind,row,checked}) => <article key={`${kind}-${row._id.toString()}`} className="flex items-center justify-between rounded-xl border bg-white p-4"><div><strong>{row.title}</strong><p className="text-sm text-muted">{kind} · Last verified: {checked?.toISOString().slice(0,10) ?? "Never"} · {row.officialLink}</p></div><form action={markVerified.bind(null,kind,row.slug)}><button className="rounded bg-forest px-3 py-2 text-white">Mark verified now</button></form></article>)}</div></section>;
}
