"use client";
import { useState } from "react";
import { bulkResolveReview } from "../actions";

export function BulkReview({ ids }: { ids: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  if (!ids.length) return null;
  return <div className="mb-4 rounded border bg-white p-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.length > 0 && selected.length === ids.length} onChange={(e) => setSelected(e.target.checked ? ids : [])} />Select all suggestions ({ids.length})</label><div className="my-2 flex flex-wrap gap-3">{ids.map(id => <label key={id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={selected.includes(id)} onChange={e => setSelected(e.target.checked ? [...selected,id] : selected.filter(value => value !== id))} />{id.slice(-6)}</label>)}</div><div className="flex gap-2"><button disabled={!selected.length} onClick={() => void bulkResolveReview(selected,"approve")} className="rounded bg-emerald-700 px-3 py-1 text-sm text-white disabled:opacity-50">Approve selected</button><button disabled={!selected.length} onClick={() => { const reason = window.prompt("Reason for rejection?"); if (reason !== null) void bulkResolveReview(selected,"reject",reason); }} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Reject selected</button></div></div>;
}
