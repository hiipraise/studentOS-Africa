import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { getOpportunities, getOpportunityFacets } from "@/lib/data/opportunities";
import { parsePage, parseEnum, parseSearchText } from "@/lib/safe-query";
import { defaultCountryForVisitor } from "@/lib/domain/locale";
import { recordEvent } from "@/lib/events";
import type { OpportunitySearchInput } from "@/lib/search";
import { LOCALE_COOKIE, localeFromValue, translate } from "@/lib/i18n";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Browse scholarships, internships, fellowships, grants, competitions, and hackathons for African students. Filter by country, level, field, funding and deadline.",
  alternates: { canonical: "/opportunities" },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const asString = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = localeFromValue((await cookies()).get(LOCALE_COOKIE)?.value);
  const page = parsePage(asString(params.page) ?? null);
  const pageSize = 12;
  const q = parseSearchText(asString(params.q) ?? null);
  const level = parseEnum(asString(params.level) ?? null, ["highschool", "undergraduate", "postgraduate", "phd", "professional"] as const);
  const deadline = parseEnum(asString(params.deadline) ?? null, ["week", "month", "quarter"] as const);
  const status = parseEnum(asString(params.status) ?? null, ["open", "upcoming", "closed", "rolling", "unknown"] as const);
  const requestedCountry = asString(params.country);
  const defaultCountry = requestedCountry ? undefined : await defaultCountryForVisitor();
  const country = requestedCountry || defaultCountry;

  const input: OpportunitySearchInput = {
    q,
    category: asString(params.category),
    country,
    level,
    field: asString(params.field),
    funding: asString(params.funding),
    deadline,
    status,
    showClosed: asString(params.showClosed) === "true",
    page,
    pageSize,
  };

  const [{ items, total, engine }, facets] = await Promise.all([getOpportunities(input), getOpportunityFacets()]);

  if (q) {
    void recordEvent({ type: total === 0 ? "zero_result" : "search", query: q, resultCount: total, engine, page: "opportunities", country });
  }

  const preserve: Record<string, string> = {};
  for (const key of ["category", "country", "q", "level", "field", "funding", "deadline", "status"]) {
    const value = asString(params[key]);
    if (value) preserve[key] = value;
  }

  return (
    <div className="container-site py-10 md:py-14">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">{translate(locale, "opps.title")}</h1>
        <p className="text-muted max-w-2xl">
          {translate(locale, "opps.subtitle")}
        </p>
        <div className="flex flex-wrap gap-3 text-sm pt-1">
          <Link href="/closing-soon" className="font-medium text-forest underline">{translate(locale, "common.closingSoon")}</Link>
          <Link href="/new" className="font-medium text-forest underline">New this week</Link>
          <Link href="/deadlines" className="font-medium text-forest underline">{translate(locale, "common.deadlines")}</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={null}>
            <OpportunityFilters fields={facets.fields} defaultCountry={defaultCountry ?? ""} />
          </Suspense>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted">
              {total} {total === 1 ? "opportunity" : "opportunities"} found
              {q ? ` for “${q}”` : ""}
              {engine === "regex" || engine === "text" ? " · basic search" : ""}
            </p>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={input.showClosed} readOnly className="peer sr-only" />
              <Link href={{ pathname: "/opportunities", query: { ...preserve, showClosed: input.showClosed ? undefined : "true" } }} className="underline">
                {input.showClosed ? "Hide closed" : "Include closed"}
              </Link>
            </label>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col gap-4">
              <EmptyState
                title="No opportunities matched"
                message={q ? `We have not found “${q}” yet. Try a broader term, or explore what is closing soon.` : "Try a different filter combination."}
                href="/opportunities"
                hrefLabel="Clear filters"
              />
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-sm font-semibold text-ink">Try these instead</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href="/closing-soon" className="chip">Closing this week</Link>
                  <Link href="/new" className="chip">New this week</Link>
                  {["Scholarship", "Fellowship", "Grant"].map((category) => (
                    <Link key={category} href={`/opportunities?category=${category}`} className="chip">{category}</Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((opportunity) => (
                  <OpportunityCard key={opportunity.slug} opportunity={opportunity} />
                ))}
              </div>
              <Suspense fallback={null}>
                <Pagination total={total} page={page} pageSize={pageSize} />
              </Suspense>
            </>
          )}

          <section className="mt-10 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-ink">Browse by country</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {[["NG", "Nigeria"], ["KE", "Kenya"], ["GH", "Ghana"], ["ZA", "South Africa"], ["EG", "Egypt"], ["ET", "Ethiopia"], ["UG", "Uganda"], ["TZ", "Tanzania"], ["CM", "Cameroon"], ["SN", "Senegal"]].map(([code, name]) => (
                <Link key={code} href={`/opportunities/country/${code}`} className="chip">{name}</Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
