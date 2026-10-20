import { BarChart3, Info } from "lucide-react";
import type { RateSummary, ReportStats } from "@/lib/domain/report-stats";

function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function SummaryBar({ summary, label }: { summary: RateSummary; label: string }) {
  if (!summary.enoughData) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-sage/30 p-3">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">
          Not enough reports yet ({summary.counts.total} of 5). We do not show a rate from a tiny sample.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-lg font-bold tabular-nums text-forest">{percent(summary.workedRate)}</p>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-sage" aria-hidden="true">
        <span className="bg-emerald-500" style={{ width: `${((summary.counts.worked ?? 0) / summary.counts.total) * 100}%` }} />
        <span className="bg-amber-400" style={{ width: `${((summary.counts.partial ?? 0) / summary.counts.total) * 100}%` }} />
        <span className="bg-rose-400" style={{ width: `${((summary.counts.failed ?? 0) / summary.counts.total) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Worked {summary.counts.worked} · Partly {summary.counts.partial} · Failed {summary.counts.failed} · n={summary.counts.total}
      </p>
    </div>
  );
}

export function ReportStatsPanel({ stats }: { stats: ReportStats }) {
  const countryRows = stats.byCountry.filter((row) => row.enoughData).slice(0, 8);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-sage/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <BarChart3 className="h-4 w-4 text-forest" aria-hidden="true" />
          Does it work?
        </h2>
        <span className="text-xs text-muted">Last {stats.windowMonths} months</span>
      </div>

      <SummaryBar summary={stats.overall} label="Overall student success rate" />

      {countryRows.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {countryRows.map((row) => (
            <SummaryBar key={row.code} summary={row} label={row.name} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Country-level rates appear after five approved reports from that country. {stats.byCountry.length > 0 ? "Some countries have reports but not yet enough." : ""}
        </p>
      )}

      <p className="inline-flex items-start gap-1.5 text-xs text-muted">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        Percentages are the share of approved reports where a student said it worked, weighted toward the last year.
        {stats.overall.counts.unknown > 0 ? ` ${stats.overall.counts.unknown} older report(s) have no recorded outcome.` : ""}
      </p>
    </section>
  );
}
