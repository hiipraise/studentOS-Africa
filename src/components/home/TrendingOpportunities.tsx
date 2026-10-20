import { SectionHeader } from "@/components/shared/SectionHeader";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getTrendingOpportunities } from "@/lib/data/opportunities";

export async function TrendingOpportunities() {
  const opportunities = await getTrendingOpportunities(6).catch(() => []);

  return (
    <section className="section">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Closing soon"
          title="Trending Opportunities"
          subtitle="Scholarships, internships, and fellowships with deadlines coming up."
          href="/opportunities"
          hrefLabel="View all opportunities"
        />

        {opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities yet"
            message="Check back soon — new opportunities are added regularly."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.slug} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
