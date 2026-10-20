import { SectionHeader } from "@/components/shared/SectionHeader";
import { ToolCard } from "@/components/tools/ToolCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getFeaturedTools } from "@/lib/data/tools";

export async function FeaturedTools() {
  const tools = await getFeaturedTools(4).catch(() => []);

  return (
    <section className="section">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Build faster"
          title="Featured Tools"
          subtitle="Free AI, coding, and productivity tools every student should know."
          href="/tools"
          hrefLabel="View all tools"
        />

        {tools.length === 0 ? (
          <EmptyState
            title="No tools yet"
            message="Check back soon — free tools are added regularly."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
