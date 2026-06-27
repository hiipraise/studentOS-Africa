import { SectionHeader } from "@/components/shared/SectionHeader";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { getFeaturedBenefits } from "@/lib/data/benefits";

export async function FeaturedBenefits() {
  const benefits = await getFeaturedBenefits(4);

  return (
    <section className="section-muted">
      <div className="container-site flex flex-col gap-8">
        <SectionHeader
          eyebrow="Free perks"
          title="Featured Benefits"
          subtitle="Student discounts and free upgrades worth claiming today."
          href="/benefits"
          hrefLabel="View all benefits"
        />

        {benefits.length === 0 ? (
          <EmptyState
            title="No benefits yet"
            message="Check back soon — student benefits are added regularly."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <BenefitCard key={b.slug} benefit={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
