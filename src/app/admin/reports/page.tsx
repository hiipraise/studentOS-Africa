import { getDb, Collections } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { moderateReport, deleteReport } from "../actions";
import type { Report } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();

  const db = await getDb();
  const [pending, approved, rejected] = await Promise.all([
    db.collection<Report>(Collections.reports).find({ status: "pending" }).sort({ createdAt: -1 }).toArray(),
    db.collection<Report>(Collections.reports).find({ status: "approved" }).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection<Report>(Collections.reports).find({ status: "rejected" }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-6">Reports Moderation</h1>

      {/* Pending reports */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          Pending Review
          {pending.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-muted">No pending reports to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((report) => (
              <ReportCard key={report._id?.toString()} report={report} />
            ))}
          </div>
        )}
      </section>

      {/* Recent approved */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink mb-4">Recently Approved</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted">No approved reports yet.</p>
        ) : (
          <div className="space-y-2">
            {approved.map((report) => (
              <ReportRow key={report._id?.toString()} report={report} />
            ))}
          </div>
        )}
      </section>

      {/* Recent rejected */}
      <section>
        <h2 className="text-lg font-semibold text-ink mb-4">Recently Rejected</h2>
        {rejected.length === 0 ? (
          <p className="text-sm text-muted">No rejected reports yet.</p>
        ) : (
          <div className="space-y-2">
            {rejected.map((report) => (
              <ReportRow key={report._id?.toString()} report={report} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const id = report._id?.toString();
  if (!id) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink text-sm">{report.benefitTitle}</p>
          <p className="text-xs text-muted mt-0.5">
            {report.school} &middot; {report.country}
          </p>
          <p className="text-sm text-ink/80 mt-2 line-clamp-3">
            &ldquo;{report.comment}&rdquo;
          </p>
          <p className="text-xs text-muted mt-2">
            Submitted {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <form
            action={async () => {
              "use server";
              await moderateReport(id, "approved");
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Approve
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await moderateReport(id, "rejected");
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteReport(id);
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                if (!confirm("Delete this report permanently?")) e.preventDefault();
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink truncate">{report.benefitTitle}</p>
        <p className="text-xs text-muted truncate">
          {report.school} &middot; {report.country}
        </p>
      </div>
      <span
        className={`shrink-0 ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
          report.status === "approved"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        }`}
      >
        {report.status}
      </span>
    </div>
  );
}
