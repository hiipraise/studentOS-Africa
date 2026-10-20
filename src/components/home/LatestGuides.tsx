import { SectionHeader } from "@/components/shared/SectionHeader";
import { GuideCard } from "@/components/guides/GuideCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getLatestGuides } from "@/lib/data/guides";

export async function LatestGuides() {
  const guides = await getLatestGuides(4).catch(() => []);
  const [featured, ...rest] = guides;

  return (
    <section className="section-muted">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Read up"
          title="Latest Guides"
          subtitle="Step-by-step walkthroughs for claiming benefits and winning applications."
          href="/guides"
          hrefLabel="View all guides"
        />

        {guides.length === 0 ? (
          <EmptyState
            title="No guides yet"
            message="Check back soon — guides are published regularly."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {featured && (
              <div className="lg:col-span-1 lg:row-span-2">
                <GuideCard guide={featured} featured />
              </div>
            )}
            {rest.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
