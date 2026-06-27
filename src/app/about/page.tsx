import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "StudentOS Africa is a discovery platform built for African students.",
};

export default function AboutPage() {
  return (
    <div className="container-site py-16 md:py-24">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest">
          Our mission
        </span>
        <h1 className="font-display text-3xl md:text-5xl text-ink leading-tight">
          Opportunity shouldn&apos;t depend on where you were born.
        </h1>

        <div className="flex flex-col gap-4 text-ink/80 leading-relaxed text-[15px]">
          <p>
            StudentOS Africa exists because too many brilliant students miss out on
            scholarships, internships, and free tools simply because they never heard about them.
          </p>
          <p>
            We built a single home for everything a student needs to discover — scholarships,
            internships, fellowships, grants, competitions, hackathons, student benefits, and
            free tools — all curated, all verified, all in one place.
          </p>
          <p>
            Every benefit listed includes real reports from real students who tried claiming
            it, so you know what actually works before you spend your time on it.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/opportunities" className="btn-primary">
            Explore Opportunities
          </Link>
          <Link href="/finder" className="btn-ghost border border-border rounded-lg">
            Try the AI Finder
          </Link>
        </div>
      </div>
    </div>
  );
}
