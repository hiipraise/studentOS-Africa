import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CheckCircle2, BookOpen } from "lucide-react";
import { CommunityReportsList } from "@/components/reports/CommunityReportsList";
import { getBenefitBySlug } from "@/lib/data/benefits";
import { TrustMetadata } from "@/components/shared/TrustMetadata";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBenefitBySlug(slug);

  if (!result) return { title: "Benefit not found" };

  return {
    title: result.benefit.title,
    description: result.benefit.description.slice(0, 160),
  };
}

export default async function BenefitDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getBenefitBySlug(slug);

  if (!result) notFound();

  const { benefit, reports } = result;
  const { title, description, eligibility, requirements, officialLink, guideLink, image, _id } = benefit;

  return (
    <div className="container-site py-10 md:py-14">
      <Link
        href="/benefits"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Benefits
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        {/* Main content */}
        <article className="flex flex-col gap-8 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-4">
            {image ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
                <Image src={image} alt={`${title} logo`} fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage border border-border">
                <span className="text-xl font-bold text-forest">{title[0]}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h1>
              <p className="text-sm text-muted">{eligibility}</p>
            </div>
          </div>

          <p className="text-ink/80 leading-relaxed text-[15px]">{description}</p>
          <TrustMetadata slug={slug} verifiedAt={benefit.lastChecked} verifiedBy={benefit.verifiedBy} sourceUrl={officialLink} confidence={benefit.confidence} staleAt={benefit.lastChecked} />
          {benefit.availability && <section><h2 className="font-semibold">Availability by country</h2><p className="text-sm text-muted">{Object.entries(benefit.availability.countries).map(([code, state]) => `${code}: ${state}`).join(" · ") || "Country availability has not been verified."}</p>{benefit.availability.notes && <p className="text-sm text-muted">{benefit.availability.notes}</p>}</section>}
          {benefit.verificationMethod && <p className="text-sm text-muted">Verification method: {benefit.verificationMethod}</p>}
          {benefit.paymentNotes && <p className="text-sm text-muted">Payment notes: {benefit.paymentNotes}</p>}

          {/* Requirements */}
          {requirements.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">What you&apos;ll need</h2>
              <ul className="flex flex-col gap-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <CheckCircle2 className="h-4 w-4 text-forest shrink-0 mt-0.5" aria-hidden="true" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Community reports */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Community Reports</h2>
              <Link
                href={`/reports/submit?benefitId=${_id?.toString() ?? ""}&benefitTitle=${encodeURIComponent(title)}`}
                className="text-sm font-medium text-forest hover:text-forest-600 transition-colors"
              >
                Share your experience
              </Link>
            </div>
            <CommunityReportsList
              reports={reports}
              emptyMessage="No reports yet for this benefit. Be the first to share whether it worked for you."
            />
          </section>
        </article>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card-base flex flex-col gap-3">
            <a href={officialLink} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              Claim This Benefit
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            {guideLink && (
              <a
                href={guideLink}
                className="btn-ghost justify-center border border-border rounded-lg"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Read the step-by-step guide
              </a>
            )}

            <p className="text-xs text-muted text-center leading-relaxed pt-1">
              You&apos;ll be redirected to the official site to claim this benefit.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
