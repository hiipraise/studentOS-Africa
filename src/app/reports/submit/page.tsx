import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/reports/ReportForm";

export const metadata: Metadata = {
  title: "Submit a Report",
  description: "Share your experience claiming a student benefit with the StudentOS Africa community.",
};

interface PageProps {
  searchParams: Promise<{ benefitId?: string; benefitTitle?: string }>;
}

export default async function SubmitReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container-site py-10 md:py-14">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Reports
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Share Your Experience
          </h1>
          <p className="text-muted text-sm">
            Help other students by sharing whether a benefit actually worked for you.
            Reports are reviewed before going live.
          </p>
        </div>

        <ReportForm
          initialBenefitId={params.benefitId}
          initialBenefitTitle={params.benefitTitle}
        />
      </div>
    </div>
  );
}
