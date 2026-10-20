"use client";

import { useState } from "react";
import { ThumbsUp, Lightbulb } from "lucide-react";
import type { BenefitTip } from "@/types";

interface TipsListProps {
  benefitId: string;
  tips: BenefitTip[];
}

export function TipsList({ benefitId, tips }: TipsListProps) {
  const [helpful, setHelpful] = useState<number[]>(tips.map((tip) => tip.helpful));
  const [voted, setVoted] = useState<number | null>(null);
  const [error, setError] = useState("");

  const published = tips.map((tip, index) => ({ tip, index })).filter(({ tip }) => tip.published !== false);

  if (published.length === 0) return null;

  async function vote(index: number) {
    if (voted !== null) return;
    setError("");
    try {
      const response = await fetch("/api/benefits/tips/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benefitId, index }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error ?? "Could not record your vote");
      setHelpful((current) => current.map((value, position) => (position === index ? value + 1 : value)));
      setVoted(index);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your vote");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <Lightbulb className="h-4 w-4 text-forest" aria-hidden="true" />
          Community tips
        </h2>
        <p className="mt-0.5 text-xs text-muted">Moderated tips from students. Not official advice.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {published.map(({ tip, index }) => (
          <li key={`${index}-${tip.body.slice(0, 20)}`} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white p-3">
            <p className="text-sm leading-relaxed text-ink/80">{tip.body}</p>
            <button
              type="button"
              onClick={() => vote(index)}
              disabled={voted !== null}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60"
              aria-label={`Mark tip helpful (${helpful[index]} people found this helpful)`}
            >
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
              {helpful[index]}
            </button>
          </li>
        ))}
      </ul>
      {voted !== null && <p className="text-xs text-forest">Thanks — your vote was recorded.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
