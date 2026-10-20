"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { readLocalSaved, toggleLocalSaved } from "@/lib/client-saved";

interface SaveButtonProps {
  slug: string;
  title: string;
  deadline?: string | null;
  className?: string;
  compact?: boolean;
}

export function SaveButton({ slug, title, deadline, className, compact }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSaved(readLocalSaved().some((item) => item.slug === slug));
    fetch("/api/saved", { method: "GET" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setSaved(json.data.some((item: { opportunitySlug: string }) => item.opportunitySlug === slug));
      })
      .catch(() => undefined);
  }, [slug]);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    toggleLocalSaved({ slug, title, deadline: deadline ?? null });
    try {
      const response = next
        ? await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, title, deadline }) })
        : await fetch(`/api/saved?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (response.ok) {
        // A successful server write supersedes the local copy.
        toggleLocalSaved({ slug, title, deadline: deadline ?? null });
      }
    } catch {
      // Local storage keeps the anonymous state.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      className={cn("inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted hover:text-forest hover:border-forest/40 transition-colors", saved && "text-forest border-forest/40", className)}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
      {!compact && (saved ? "Saved" : "Save")}
    </button>
  );
}
