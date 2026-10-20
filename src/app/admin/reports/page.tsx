import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { getDb, Collections } from "@/lib/db";
import { requireEditor } from "@/lib/authz";
import { moderateReport, deleteReport } from "../actions";
import { APPROVED_REPORT_FILTER, PENDING_REPORT_FILTER } from "@/lib/reports";
import type { Report } from "@/types";

export const dynamic = "force-dynamic";

const OUTCOME_LABEL: Record<string, string> = {
  worked: "Worked",
  partial: "Partly worked",
  failed: "Didn't work",
  unknown: "Outcome not recorded",
};

export default async function AdminReportsPage() {
  await requireEditor();

  const db = await getDb();
  const [pending, approved, rejected] = await Promise.all([
    db.collection<Report>(Collections.reports).find(PENDING_REPORT_FILTER).sort({ createdAt: -1 }).limit(100).toArray(),
    db.collection<Report>(Collections.reports).find(APPROVED_REPORT_FILTER).sort({ reportDate: -1, createdAt: -1 }).limit(20).toArray(),
    db.collection<Report>(Collections.reports).find({ $or: [{ moderation: "rejected" }, { moderation: { $exists: false }, status: "rejected" }] }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-ink">Reports moderation</h1>
      <p className="mb-6 text-sm text-muted">
        The student&apos;s outcome and our moderation decision are separate. Approving publishes the report and adds it to the
        benefit&apos;s statistics; rejecting keeps it out. A reason is emailed when the student left an address.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
          Pending review
          {pending.length > 0 && <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">{pending.length}</span>}
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-muted">No pending reports to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((report) => (
              <ReportCard key={report._id?.toString()} report={report} pending />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-ink">Recently approved</h2>
        {approved.length === 0 ? <p className="text-sm text-muted">No approved reports yet.</p> : <div className="space-y-2">{approved.map((report) => <ReportCard key={report._id?.toString()} report={report} />)}</div>}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Recently rejected</h2>
        {rejected.length === 0 ? <p className="text-sm text-muted">No rejected reports yet.</p> : <div className="space-y-2">{rejected.map((report) => <ReportCard key={report._id?.toString()} report={report} />)}</div>}
      </section>
    </div>
  );
}

function ReportCard({ report, pending = false }: { report: Report; pending?: boolean }) {
  const id = report._id?.toString();
  if (!id) return null;

  const outcome = report.outcome ?? "unknown";
  const decision = report.moderation ?? report.status ?? "pending";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink">{report.benefitTitle}</p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">{OUTCOME_LABEL[outcome] ?? outcome}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${decision === "approved" ? "bg-emerald-50 text-emerald-700" : decision === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{decision}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {report.school} · {report.country}
            {report.countryCode ? ` (${report.countryCode})` : ""} · {new Date(report.reportDate ?? report.createdAt).toLocaleDateString("en-GB")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">&ldquo;{report.comment}&rdquo;</p>

          <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted sm:grid-cols-3">
            <div>
              <dt className="inline font-medium text-ink/70">Verification: </dt>
              <dd className="inline">{report.verificationMethod ?? "not shared"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink/70">Approval time: </dt>
              <dd className="inline">{typeof report.timeToApproveDays === "number" ? `${report.timeToApproveDays} days` : "not shared"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink/70">Payment issue: </dt>
              <dd className="inline">{report.paymentIssue?.occurred ? report.paymentIssue.notes || "yes" : "no / not shared"}</dd>
            </div>
          </dl>

          {report.submitterEmail && <p className="mt-2 text-xs text-muted">Decision email: {report.submitterEmail}</p>}
          {report.moderationReason && <p className="mt-2 rounded bg-gray-50 p-2 text-xs text-muted">Reason: {report.moderationReason}</p>}
        </div>

        <div className="shrink-0 lg:w-[260px]">
          <form
            action={async (formData: FormData) => {
              "use server";
              await moderateReport(id, "approved", String(formData.get("reason") ?? ""));
            }}
            className="flex flex-col gap-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3"
          >
            <label htmlFor={`reason-${id}`} className="text-xs font-medium text-ink">
              Moderation reason (optional)
            </label>
            <textarea id={`reason-${id}`} name="reason" rows={2} maxLength={500} placeholder="Why this decision?" className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs" />
            <div className="flex gap-2">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> {pending ? "Approve" : "Re-approve"}
              </button>
            </div>
          </form>

          <form
            action={async (formData: FormData) => {
              "use server";
              await moderateReport(id, "rejected", String(formData.get("reason") ?? ""));
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input name="reason" maxLength={500} placeholder="Rejection reason" aria-label="Rejection reason" className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs" />
            <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Reject
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await deleteReport(id);
            }}
            className="mt-2"
          >
            <button type="submit" className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-gray-100">
              Delete permanently
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
