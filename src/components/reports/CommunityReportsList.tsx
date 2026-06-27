import { MapPin, MessageSquareText } from "lucide-react";
import type { Report } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
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
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-sage/40 py-10 px-6 text-center">
        <MessageSquareText className="h-5 w-5 text-muted" aria-hidden="true" />
        <p className="text-sm text-muted max-w-[32ch]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reports.map((report, i) => (
        <li key={i} className="rounded-xl border border-border bg-white p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <MapPin className="h-3.5 w-3.5 text-muted shrink-0" aria-hidden="true" />
              {report.school}, {report.country}
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${
                STATUS_STYLES[report.status] ?? STATUS_STYLES.pending
              }`}
            >
              {report.status === "approved" ? "Worked" : report.status === "rejected" ? "Didn't work" : "Pending"}
            </span>
          </div>
          <p className="text-sm text-ink/70 leading-relaxed">{report.comment}</p>
        </li>
      ))}
    </ul>
  );
}
