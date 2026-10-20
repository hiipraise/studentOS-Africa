"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Download, Loader2, Trash2 } from "lucide-react";
import type { SavedItem } from "@/types";
import { readLocalSaved, writeLocalSaved, type LocalSavedItem } from "@/lib/client-saved";

const STAGES = [
  { value: "saved", label: "Saved" },
  { value: "preparing", label: "Preparing" },
  { value: "submitted", label: "Submitted" },
  { value: "result", label: "Result" },
] as const;

interface SavedClientProps {
  initial: SavedItem[];
  signedIn: boolean;
}

export function SavedClient({ initial, signedIn }: SavedClientProps) {
  const [items, setItems] = useState<SavedItem[]>(initial);
  const [local, setLocal] = useState<LocalSavedItem[]>([]);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    const localItems = readLocalSaved();
    setLocal(localItems);
    if (signedIn && localItems.length) {
      setMerging(true);
      fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: localItems.map((item) => ({ slug: item.slug, title: item.title, deadline: item.deadline ?? null })) }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then(() => {
          writeLocalSaved([]);
          setLocal([]);
          return fetch("/api/saved").then((response) => (response.ok ? response.json() : null));
        })
        .then((json) => {
          if (json?.success) setItems(json.data as SavedItem[]);
        })
        .catch(() => undefined)
        .finally(() => setMerging(false));
    }
  }, [signedIn]);

  async function updateStage(slug: string, stage: SavedItem["stage"]) {
    setItems((current) => current.map((item) => (item.opportunitySlug === slug ? { ...item, stage } : item)));
    await fetch("/api/saved", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, stage }) });
  }

  async function updateNotes(slug: string, notes: string) {
    await fetch("/api/saved", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, notes }) });
  }

  async function remove(slug: string) {
    setItems((current) => current.filter((item) => item.opportunitySlug !== slug));
    if (signedIn) await fetch(`/api/saved?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    else {
      const next = readLocalSaved().filter((item) => item.slug !== slug);
      writeLocalSaved(next);
      setLocal(next);
    }
  }

  const display = signedIn
    ? items
    : local.map((item) => ({ opportunitySlug: item.slug, opportunityTitle: item.title, deadline: item.deadline ? new Date(item.deadline) : null, stage: "saved" as const, notes: "", userEmail: "", createdAt: new Date(), updatedAt: new Date() }));

  if (!display.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-forest/40" aria-hidden="true" />
        <p className="mt-3 font-semibold text-ink">Nothing saved yet</p>
        <p className="mt-1 text-sm text-muted">Tap the bookmark on any opportunity to build your deadline list.</p>
        <Link href="/opportunities" className="btn-primary mt-5">Browse opportunities</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{display.length} saved {display.length === 1 ? "item" : "items"}{merging ? " · merging your anonymous saves…" : ""}</p>
        {signedIn ? (
          <a href="/api/saved/export" className="btn-ghost border border-border rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
            <Download className="h-4 w-4" aria-hidden="true" /> Export calendar
          </a>
        ) : (
          <Link href="/login?callbackUrl=/saved" className="btn-primary text-sm py-2 px-4">Sign in to sync</Link>
        )}
      </div>

      {display.map((item) => (
        <article key={item.opportunitySlug} className="card-base flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={`/opportunities/${item.opportunitySlug}`} className="font-semibold text-ink hover:text-forest">{item.opportunityTitle}</Link>
              {item.deadline && <p className="text-xs text-muted mt-1">Closes {new Date(item.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>}
            </div>
            <button onClick={() => remove(item.opportunitySlug)} className="text-muted hover:text-red-500" aria-label={`Remove ${item.opportunityTitle}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Tracker stage for ${item.opportunityTitle}`}>
            {STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => signedIn && updateStage(item.opportunitySlug, stage.value)}
                className={`chip ${item.stage === stage.value ? "chip-active" : ""} ${signedIn ? "" : "cursor-default opacity-70"}`}
                aria-pressed={item.stage === stage.value}
              >
                {stage.label}
              </button>
            ))}
          </div>

          {signedIn && (
            <label className="text-xs text-muted">
              Notes
              <textarea
                defaultValue={item.notes ?? ""}
                rows={2}
                onBlur={(event) => updateNotes(item.opportunitySlug, event.target.value)}
                placeholder="Requirements, contacts, what is left to do..."
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink"
              />
            </label>
          )}
        </article>
      ))}

      {!signedIn && <p className="text-xs text-muted">Your saves live on this device. Sign in to keep them across phones and receive deadline reminders.</p>}
      {merging && <p className="flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing saves to your account</p>}
    </div>
  );
}
