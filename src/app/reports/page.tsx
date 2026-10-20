import type { Metadata } from "next";
import Link from "next/link";
import { CommunityReportsList } from "@/components/reports/CommunityReportsList";
import { getDb, Collections } from "@/lib/db";
import { APPROVED_REPORT_FILTER } from "@/lib/reports";
import type { Report } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Reports",
  description: "Real experiences from students across Africa who claimed scholarships, internships, and student benefits.",
  alternates: { canonical: "/reports" },
};

async function getAllApprovedReports(limit = 30) {
  try {
    const db = await getDb();
    return await db
      .collection<Report>(Collections.reports)
      .find(APPROVED_REPORT_FILTER)
      .sort({ reportDate: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}

export default async function ReportsPage() {
  const reports = await getAllApprovedReports();

  return (
    <div className="container-site py-12 md:py-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">Community Reports</h1>
          <p className="max-w-2xl text-muted">
            Real experiences from students across Africa — did it actually work for them? Outcomes and moderation are kept
            separate, and statistics only appear once enough reports exist.
          </p>
        </div>
        <Link href="/reports/submit" className="btn-primary shrink-0">
          Submit a Report
        </Link>
      </div>

      <div className="max-w-2xl">
        <CommunityReportsList
          reports={reports}
          emptyMessage="No approved reports yet. Be the first to share your experience."
        />
      </div>
    </div>
  );
}
