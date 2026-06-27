import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CheckCircle2, Globe, Gift } from "lucide-react";
import { DeadlineBadge } from "@/components/shared/DeadlineBadge";
import { getOpportunityBySlug } from "@/lib/data/opportunities";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);

  if (!opportunity) return { title: "Opportunity not found" };

  return {
    title: opportunity.title,
    description: opportunity.description.slice(0, 160),
    openGraph: {
      title: opportunity.title,
      description: opportunity.description.slice(0, 160),
      images: opportunity.image ? [{ url: opportunity.image }] : undefined,
    },
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);

  if (!opportunity) notFound();

  const {
    title, description, category, countries,
    deadline, requirements, benefits,
    applicationSteps, officialLink, image,
  } = opportunity;

  return (
    <div className="container-site py-10 md:py-14">
      {/* Back link */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Opportunities
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        {/* Main content */}
        <article className="flex flex-col gap-8 min-w-0">
          {/* Hero image */}
          {image && (
            <div className="relative h-56 md:h-72 w-full overflow-hidden rounded-2xl bg-sage">
              <Image src={image} alt={title} fill className="object-cover" priority />
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
              {category}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-ink tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-muted leading-relaxed text-[15px]">{description}</p>
          </div>

          {/* Requirements */}
          {requirements.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">Requirements</h2>
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

          {/* What you get */}
          {benefits.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">What you get</h2>
              <ul className="flex flex-col gap-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <Gift className="h-4 w-4 text-gold-dark shrink-0 mt-0.5" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Application steps */}
          {applicationSteps.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">How to apply</h2>
              <ol className="flex flex-col gap-3">
                {applicationSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card-base flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">
                Deadline
              </span>
              <DeadlineBadge deadline={deadline} />
            </div>

            <div className="flex items-start gap-2 pt-3 border-t border-border">
              <Globe className="h-4 w-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted uppercase tracking-wide">
                  Eligible countries
                </span>
                <p className="text-sm text-ink">{countries.join(", ")}</p>
              </div>
            </div>

            <a
              href={officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center mt-2"
            >
              Apply Now
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            <p className="text-xs text-muted text-center leading-relaxed">
              You&apos;ll be redirected to the official application page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
