import { SectionHeader } from "@/components/shared/SectionHeader";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { getClosingSoon, getNewThisWeek } from "@/lib/data/opportunities";

export async function ClosingSoonSection() {
  const items = await getClosingSoon(3, 14).catch(() => []);
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Don't miss these"
          title="Closing in the next two weeks"
          subtitle="Sorted by the closest deadline, not by when we added them."
          href="/closing-soon"
          hrefLabel="See everything closing this week"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}
        </div>
      </div>
    </section>
  );
}

export async function NewThisWeekSection() {
  const items = await getNewThisWeek(3).catch(() => []);
  if (!items.length) return null;
  return (
    <section className="section-muted">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Fresh"
          title="New this week"
          subtitle="Newly verified opportunities added in the last seven days."
          href="/new"
          hrefLabel="See all new opportunities"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}
        </div>
      </div>
    </section>
  );
}
