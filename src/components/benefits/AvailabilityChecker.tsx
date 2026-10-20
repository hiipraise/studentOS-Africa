"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { AvailabilityEntry, AvailabilityState } from "@/lib/domain/report-stats";

const STATE_META: Record<AvailabilityState, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  works: { label: "Works here", className: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  partial: { label: "Works partly", className: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
  blocked: { label: "Blocked here", className: "text-rose-700 bg-rose-50 border-rose-200", icon: XCircle },
  unknown: { label: "Not verified", className: "text-muted bg-gray-50 border-border", icon: HelpCircle },
};

interface AvailabilityCheckerProps {
  entries: AvailabilityEntry[];
  notes?: string;
  updatedAt?: string | null;
}

export function AvailabilityChecker({ entries, notes, updatedAt }: AvailabilityCheckerProps) {
  const [code, setCode] = useState("");
  const selected = entries.find((entry) => entry.code === code);
  const meta = selected ? STATE_META[selected.state] : null;
  const Icon = meta?.icon;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Does this work in my country?</h2>
        <p className="mt-0.5 text-xs text-muted">
          Based on admin checks and approved reports. {updatedAt ? `Last updated ${new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.` : "No verified country data yet."}
        </p>
      </div>

      {entries.length > 0 ? (
        <>
          <label htmlFor="availability-country" className="sr-only">
            Choose your country
          </label>
          <select
            id="availability-country"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest"
          >
            <option value="">Choose your country…</option>
            {entries.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name} — {STATE_META[entry.state].label}
              </option>
            ))}
          </select>

          {selected && meta && Icon && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${meta.className}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                <strong>{meta.label}.</strong> {selected.reports > 0 ? `${selected.reports} approved report(s) from this country in the last year.` : "No recent reports from this country."}
                {selected.source === "reports" ? " This is community evidence, not an official guarantee." : ""}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Country availability has not been verified yet. Check the official page before paying anything.</p>
      )}

      {notes && <p className="text-xs text-muted">{notes}</p>}
      <p className="text-xs text-muted">Availability changes. If the provider blocks your country, send a report so other students know.</p>
    </section>
  );
}
