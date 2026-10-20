import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CheckCircle2, BookOpen } from "lucide-react";
import { CommunityReportsList } from "@/components/reports/CommunityReportsList";
import { ReportStatsPanel } from "@/components/benefits/ReportStatsPanel";
import { AvailabilityChecker } from "@/components/benefits/AvailabilityChecker";
import { GuidancePanel } from "@/components/benefits/GuidancePanel";
import { TipsList } from "@/components/benefits/TipsList";
import { getBenefitBySlug } from "@/lib/data/benefits";
import { TrustMetadata } from "@/components/shared/TrustMetadata";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBenefitBySlug(slug).catch(() => null);
  if (!result) return { title: "Benefit not found" };

  const description = result.benefit.description.slice(0, 160);
  return {
    title: result.benefit.title,
    description,
    alternates: { canonical: `/benefits/${slug}` },
    openGraph: { title: result.benefit.title, description, type: "article" },
  };
}

export default async function BenefitDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getBenefitBySlug(slug).catch(() => null);
  if (!result) notFound();

  const { benefit, reports, stats, availability } = result;
  const { title, description, eligibility, requirements, officialLink, guideLink, image, _id } = benefit;
  const benefitId = _id?.toString() ?? benefit.slug;

  return (
    <div className="container-site py-10 md:py-14">
      <Link href="/benefits" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Benefits
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <article className="flex min-w-0 flex-col gap-8">
          <div className="flex items-center gap-4">
            {image ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
                <Image src={image} alt={`${title} logo`} fill sizes="64px" className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-sage">
                <span className="text-xl font-bold text-forest">{title[0]}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
              <p className="text-sm text-muted">{eligibility}</p>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-ink/80">{description}</p>

          <TrustMetadata slug={slug} verifiedAt={benefit.lastChecked} verifiedBy={benefit.verifiedBy} sourceUrl={officialLink} confidence={benefit.confidence} staleAt={benefit.lastChecked} />

          <AvailabilityChecker
            entries={availability.entries}
            notes={availability.notes}
            updatedAt={availability.updatedAt ? availability.updatedAt.toISOString() : null}
          />

          {benefit.verificationMethod && <p className="text-sm text-muted">Verification method: {benefit.verificationMethod}</p>}
          {benefit.paymentNotes && <p className="text-sm text-muted">Payment notes: {benefit.paymentNotes}</p>}

          <GuidancePanel guidance={benefit.guidance} />

          {requirements.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">What you&apos;ll need</h2>
              <ul className="flex flex-col gap-2">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ReportStatsPanel stats={stats} />

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">Community reports</h2>
              <Link href={`/reports/submit?benefitId=${benefitId}`} className="text-sm font-medium text-forest transition-colors hover:text-forest-600">
                Share your experience
              </Link>
            </div>
            <CommunityReportsList
              reports={reports}
              emptyMessage="No approved reports yet for this benefit. Be the first to say whether it worked for you."
            />
          </section>

          <TipsList benefitId={benefitId} tips={benefit.tips ?? []} />
        </article>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card-base flex flex-col gap-3">
            <a href={`/go/${benefit.slug}?from=benefit`} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              Claim This Benefit
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            {guideLink && (
              <a href={guideLink} className="btn-ghost justify-center rounded-lg border border-border">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Read the step-by-step guide
              </a>
            )}

            <p className="pt-1 text-center text-xs leading-relaxed text-muted">
              You&apos;ll be redirected to the official site. We never charge students and never hide an affiliate link.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
