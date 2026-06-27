"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Gift, Wrench, BookOpen } from "lucide-react";
import { DeadlineBadge } from "@/components/shared/DeadlineBadge";
import type { FinderResult } from "@/types";

interface FinderResultsProps {
  result: FinderResult;
  onReset: () => void;
}

export function FinderResults({ result, onReset }: FinderResultsProps) {
  const { opportunities, benefits, tools, guides, explanation } = result;
  const hasAny = opportunities.length + benefits.length + tools.length + guides.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* AI explanation */}
      <div className="rounded-2xl bg-forest/5 border border-forest/15 p-5 flex gap-3">
        <Sparkles className="h-5 w-5 text-forest shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-ink/80 leading-relaxed">{explanation}</p>
      </div>

      {!hasAny && (
        <p className="text-sm text-muted text-center py-8">
          No strong matches found yet — try broadening your interests or career goal.
        </p>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink">Recommended Opportunities</h2>
          <div className="flex flex-col gap-2">
            {opportunities.map((opp) => (
              <Link
                key={opp.slug}
                href={`/opportunities/${opp.slug}`}
                className="card-base flex items-center justify-between gap-3 no-underline"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-forest">{opp.category}</span>
                  <span className="font-medium text-ink text-sm truncate">{opp.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <DeadlineBadge deadline={opp.deadline} />
                  <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Gift className="h-4 w-4 text-gold-dark" aria-hidden="true" />
            Recommended Benefits
          </h2>
          <div className="flex flex-col gap-2">
            {benefits.map((b) => (
              <Link key={b.slug} href={`/benefits/${b.slug}`} className="card-base flex items-center justify-between gap-3 no-underline">
                <span className="font-medium text-ink text-sm">{b.title}</span>
                <ArrowRight className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Wrench className="h-4 w-4 text-forest" aria-hidden="true" />
            Recommended Tools
          </h2>
          <div className="flex flex-col gap-2">
            {tools.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="card-base flex items-center justify-between gap-3 no-underline">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-forest">{t.category}</span>
                  <span className="font-medium text-ink text-sm">{t.title}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Guides */}
      {guides.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-forest" aria-hidden="true" />
            Recommended Guides
          </h2>
          <div className="flex flex-col gap-2">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="card-base flex items-center justify-between gap-3 no-underline">
                <span className="font-medium text-ink text-sm truncate">{g.title}</span>
                <ArrowRight className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <button onClick={onReset} className="btn-ghost border border-border rounded-lg self-center px-5 py-2.5 text-sm">
        Search again
      </button>
    </div>
  );
}
