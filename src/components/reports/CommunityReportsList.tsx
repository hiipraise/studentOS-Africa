import { MapPin, MessageSquareText, ShieldCheck, CreditCard } from "lucide-react";
import type { Report } from "@/types";

const OUTCOME_STYLES: Record<string, { label: string; className: string }> = {
  worked: { label: "Worked", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { label: "Partly worked", className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Didn't work", className: "bg-red-50 text-red-700 border-red-200" },
  unknown: { label: "Outcome not recorded", className: "bg-gray-50 text-muted border-border" },
};

interface CommunityReportsListProps {
  reports: Report[];
  emptyMessage?: string;
}

export function CommunityReportsList({
  reports,
  emptyMessage = "No reports yet. Be the first to share your experience.",
}: CommunityReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-sage/40 px-6 py-10 text-center">
        <MessageSquareText className="h-5 w-5 text-muted" aria-hidden="true" />
        <p className="max-w-[34ch] text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reports.map((report, index) => {
        const style = OUTCOME_STYLES[report.outcome ?? "unknown"] ?? OUTCOME_STYLES.unknown;
        return (
          <li key={report._id?.toString() ?? index} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                {report.school}, {report.country}
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}>
                {style.label}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ink/70">{report.comment}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              {report.verificationMethod && report.verificationMethod !== "unknown" && (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Verified by {report.verificationMethod.replace("-", " ")}
                </span>
              )}
              {typeof report.timeToApproveDays === "number" && (
                <span>Approved in {report.timeToApproveDays} {report.timeToApproveDays === 1 ? "day" : "days"}</span>
              )}
              {report.paymentIssue?.occurred && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <CreditCard className="h-3 w-3" aria-hidden="true" />
                  Payment problem
                </span>
              )}
              <span>{new Date(report.reportDate ?? report.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
