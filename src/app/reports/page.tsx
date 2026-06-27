import type { Metadata } from "next";
import Link from "next/link";
import { CommunityReportsList } from "@/components/reports/CommunityReportsList";
import { getDb, Collections } from "@/lib/db";
import type { Report } from "@/types";

export const metadata: Metadata = {
  title: "Community Reports",
  description: "Real experiences from students who claimed scholarships, internships, and benefits.",
};

async function getAllApprovedReports(limit = 30) {
  const db = await getDb();
  return db
    .collection<Report>(Collections.reports)
    .find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export default async function ReportsPage() {
  const reports = await getAllApprovedReports();

  return (
    <div className="container-site py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
            Community Reports
          </h1>
          <p className="text-muted max-w-2xl">
            Real experiences from students across Africa — did it actually work for them?
          </p>
        </div>
        <Link href="/reports/submit" className="btn-primary shrink-0">
          Submit a Report
        </Link>
      </div>

      <div className="max-w-2xl">
        <CommunityReportsList
          reports={reports}
          emptyMessage="No reports yet. Be the first to share your experience."
        />
      </div>
    </div>
  );
}
