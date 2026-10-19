import type { Metadata } from "next";
import { Suspense } from "react";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { getOpportunities } from "@/lib/data/opportunities";
import { parsePage } from "@/lib/safe-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Browse scholarships, internships, fellowships, grants, competitions, and hackathons for African students.",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    country?: string;
    q?: string;
    page?: string;
    showClosed?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 12;

  const { items, total } = await getOpportunities({
    category: params.category,
    country: params.country,
    q: params.q,
    page,
    pageSize,
    showClosed: params.showClosed === "true",
  });

  return (
    <div className="container-site py-12 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
          Opportunities
        </h1>
        <p className="text-muted max-w-2xl">
          Scholarships, internships, fellowships, grants, competitions, and hackathons —
          curated for students across Africa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Filters sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={null}>
            <OpportunityFilters />
          </Suspense>
        </aside>

        {/* Results */}
        <div>
          <form className="mb-4 flex items-center gap-2 text-sm text-muted">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.country && <input type="hidden" name="country" value={params.country} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <input type="checkbox" name="showClosed" value="true" defaultChecked={params.showClosed === "true"} onChange={(event) => event.currentTarget.form?.requestSubmit()} />
            <label>Show closed opportunities</label>
          </form>
          <p className="text-sm text-muted mb-4">
            {total} {total === 1 ? "opportunity" : "opportunities"} found
          </p>

          {items.length === 0 ? (
            <EmptyState
              title="No opportunities found"
              message="Try a different category or search term."
              href="/opportunities"
              hrefLabel="Clear filters"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((opp) => (
                  <OpportunityCard key={opp.slug} opportunity={opp} />
                ))}
              </div>
              <Suspense fallback={null}>
                <Pagination total={total} page={page} pageSize={pageSize} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
