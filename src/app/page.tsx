import { Hero } from "@/components/home/Hero";
import { TrendingOpportunities } from "@/components/home/TrendingOpportunities";
import { FeaturedBenefits } from "@/components/home/FeaturedBenefits";
import { FeaturedTools } from "@/components/home/FeaturedTools";
import { LatestGuides } from "@/components/home/LatestGuides";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrendingOpportunities />
      <FeaturedBenefits />
      <FeaturedTools />
      <LatestGuides />
      <NewsletterCTA />
    </>
  );
}
