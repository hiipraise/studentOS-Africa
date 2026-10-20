import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CheckCircle2, Globe, Gift, CalendarDays, GraduationCap, Wallet } from "lucide-react";
import { DeadlineBadge } from "@/components/shared/DeadlineBadge";
import { getOpportunityBySlug, getPublishedSlugs, getRelatedOpportunities } from "@/lib/data/opportunities";
import { getOpportunityStatus, reopenLabel } from "@/lib/domain/status";
import { TrustMetadata } from "@/components/shared/TrustMetadata";
import { DeadlineTimezoneDisplay } from "@/components/opportunities/DeadlineTimezoneDisplay";
import { SaveButton } from "@/components/saved/SaveButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";
import type { Opportunity } from "@/types";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const rows = await getPublishedSlugs(500);
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug).catch(() => null);
  if (!opportunity) return { title: "Opportunity not found" };
  const title = opportunity.title;
  const description = opportunity.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/opportunities/${slug}` },
    openGraph: {
      title,
      description,
      url: `/opportunities/${slug}`,
      images: [{ url: `/opportunities/${slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/opportunities/${slug}/opengraph-image`] },
  };
}

function eligibilitySummary(opportunity: Opportunity) {
  const levels = opportunity.eligibility?.levels ?? [];
  const labels: Record<string, string> = { highschool: "High school", undergraduate: "Undergraduate", postgraduate: "Postgraduate", phd: "PhD", professional: "Professional" };
  return levels.map((level) => labels[level] ?? level);
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) notFound();

  const { title, description, category, countries, deadline, requirements, benefits, applicationSteps, image } = opportunity;
  const status = getOpportunityStatus(opportunity);
  const closesAt = opportunity.cycle?.closesAt ?? deadline;
  const related = await getRelatedOpportunities(opportunity).catch(() => []);
  const alternatives = status === "closed" ? related : [];
  const shareUrl = appUrl(`/opportunities/${slug}`);
  const levels = eligibilitySummary(opportunity);

  return (
    <div className="container-site py-10 md:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: appUrl("/") },
            { name: "Opportunities", url: appUrl("/opportunities") },
            { name: title, url: shareUrl },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description: description.slice(0, 300),
            url: shareUrl,
            isPartOf: { "@type": "WebSite", name: "StudentOS Africa", url: appUrl("/") },
            about: category,
          },
        ]}
      />

      <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to Opportunities
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <article className="flex flex-col gap-8 min-w-0">
          {image && (
            <div className="relative h-56 md:h-72 w-full overflow-hidden rounded-2xl bg-sage">
              <Image src={image} alt={title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 66vw" />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">{category}</span>
            <h1 className="text-2xl md:text-4xl font-bold text-ink tracking-tight leading-tight">{title}</h1>
            {opportunity.organisation && <p className="text-sm font-medium text-muted">{opportunity.organisation}</p>}
            <p className="text-muted leading-relaxed text-[15px]">{description}</p>
            <TrustMetadata slug={slug} verifiedAt={opportunity.verifiedAt} verifiedBy={opportunity.verifiedBy} sourceUrl={opportunity.source?.url ?? opportunity.officialLink} confidence={opportunity.confidence} staleAt={opportunity.verifiedAt} />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <SaveButton slug={slug} title={title} deadline={closesAt ? new Date(closesAt).toISOString() : null} />
              {closesAt && (
                <a href={`/api/opportunities/${slug}/calendar`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted hover:text-forest">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Add deadline to calendar
                </a>
              )}
            </div>
            <ShareButtons title={title} url={shareUrl} />
          </div>

          {(levels.length > 0 || opportunity.funding?.type) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {levels.length > 0 && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted"><GraduationCap className="h-4 w-4" aria-hidden="true" /> Study level</p>
                  <p className="mt-1 text-sm text-ink">{levels.join(", ")}</p>
                </div>
              )}
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted"><Wallet className="h-4 w-4" aria-hidden="true" /> Funding</p>
                <p className="mt-1 text-sm text-ink">
                  {opportunity.funding?.type === "full" ? "Fully funded" : opportunity.funding?.type === "partial" ? "Partial funding" : opportunity.funding?.type === "stipend" ? "Stipend" : opportunity.funding?.amountText ?? "Not stated"}
                  {opportunity.funding?.amountText && opportunity.funding.type !== "unknown" ? ` · ${opportunity.funding.amountText}` : ""}
                </p>
              </div>
            </section>
          )}

          {requirements.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">Requirements</h2>
              <ul className="flex flex-col gap-2">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <CheckCircle2 className="h-4 w-4 text-forest shrink-0 mt-0.5" aria-hidden="true" /> {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {benefits.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">What you get</h2>
              <ul className="flex flex-col gap-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <Gift className="h-4 w-4 text-gold-dark shrink-0 mt-0.5" aria-hidden="true" /> {benefit}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {applicationSteps.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-ink">How to apply</h2>
              <ol className="flex flex-col gap-3">
                {applicationSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">{index + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {related.length > 0 && (
            <section className="flex flex-col gap-3 border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-ink">{status === "closed" ? "Closed — try these open opportunities" : "Related opportunities"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((item) => (
                  <Link key={item.slug} href={`/opportunities/${item.slug}`} className="rounded-xl border border-border bg-white p-4 hover:border-forest/40">
                    <span className="text-xs font-medium text-forest">{item.category}</span>
                    <p className="mt-0.5 font-medium text-ink text-sm">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.cycle?.closesAt || item.deadline ? `Closes ${new Date((item.cycle?.closesAt ?? item.deadline) as Date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Rolling / no fixed deadline"}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card-base flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">Deadline</span>
              <DeadlineBadge deadline={closesAt} />
            </div>

            <div className="flex items-start gap-2 pt-3 border-t border-border">
              <Globe className="h-4 w-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted uppercase tracking-wide">Eligible countries</span>
                <p className="text-sm text-ink">{countries.join(", ")}</p>
              </div>
            </div>

            {closesAt && <DeadlineTimezoneDisplay deadline={new Date(closesAt)} timezone={opportunity.timezone || "UTC"} note={opportunity.deadlineNote} />}

            {status === "closed" ? (
              <div className="rounded-lg bg-sage p-3 text-sm text-ink">
                <p className="font-semibold">Applications are closed.</p>
                <p>{reopenLabel(opportunity.cycle) ?? "Check the official source for the next cycle."}</p>
              </div>
            ) : status === "upcoming" ? (
              <p className="rounded-lg bg-sage p-3 text-sm text-ink">Applications have not opened yet.</p>
            ) : status === "open" || status === "rolling" ? (
              <a href={`/go/${slug}?from=detail`} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary justify-center mt-2">
                Apply Now <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <a href={`/go/${slug}?from=detail`} target="_blank" rel="noopener noreferrer nofollow" className="btn-ghost justify-center mt-2">
                Check official status <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}

            <p className="text-xs text-muted text-center leading-relaxed">You&apos;ll be redirected to the official application page.</p>
            {opportunity.needsReview && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">An editor has not fully verified this listing. Confirm details on the official page.</p>}
          </div>

          {alternatives.length > 0 && (
            <section className="mt-5">
              <h2 className="text-sm font-semibold mb-2">Similar open opportunities</h2>
              {alternatives.filter((item) => item.slug !== slug).map((item) => (
                <Link key={item.slug} className="block text-sm text-forest underline py-1" href={`/opportunities/${item.slug}`}>{item.title}</Link>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
