import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportForm, type BenefitOption } from "@/components/reports/ReportForm";
import { getDb, Collections } from "@/lib/db";
import type { Benefit, Report } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit a Report",
  description: "Share whether a student benefit actually worked for you, and help other students in Africa decide.",
  alternates: { canonical: "/reports/submit" },
};

interface PageProps {
  searchParams: Promise<{ benefitId?: string }>;
}

async function loadFormData() {
  try {
    const db = await getDb();
    const [benefits, schools] = await Promise.all([
      db
        .collection<Benefit>(Collections.benefits)
        .find({ published: true }, { projection: { _id: 1, title: 1 } })
        .sort({ title: 1 })
        .limit(500)
        .toArray(),
      db.collection<Report>(Collections.reports).distinct("school", { school: { $type: "string" } }),
    ]);

    return {
      benefits: benefits.map<BenefitOption>((benefit) => ({ id: benefit._id?.toString() ?? "", title: benefit.title })).filter((benefit) => benefit.id),
      schools: (schools as string[]).filter(Boolean).slice(0, 100),
    };
  } catch {
    return { benefits: [] as BenefitOption[], schools: [] as string[] };
  }
}

export default async function SubmitReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { benefits, schools } = await loadFormData();

  return (
    <div className="container-site py-10 md:py-14">
      <Link href="/reports" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Reports
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Share Your Experience</h1>
          <p className="text-sm text-muted">
            Tell other students whether a benefit really worked for you. Your outcome is separate from our moderation decision,
            and we never edit what you said.
          </p>
        </div>

        <ReportForm benefits={benefits} schools={schools} initialBenefitId={params.benefitId} />
      </div>
    </div>
  );
}
