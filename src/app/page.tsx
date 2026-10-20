import { Hero } from "@/components/home/Hero";
import { TrendingOpportunities } from "@/components/home/TrendingOpportunities";
import { ClosingSoonSection, NewThisWeekSection } from "@/components/home/HomeLists";
import { FeaturedBenefits } from "@/components/home/FeaturedBenefits";
import { FeaturedTools } from "@/components/home/FeaturedTools";
import { LatestGuides } from "@/components/home/LatestGuides";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";

// ISR: the homepage is cached and refreshed every five minutes, and admins
// can revalidate it on demand after publishing.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrendingOpportunities />
      <ClosingSoonSection />
      <FeaturedBenefits />
      <NewThisWeekSection />
      <FeaturedTools />
      <LatestGuides />
      <NewsletterCTA />
    </>
  );
}
