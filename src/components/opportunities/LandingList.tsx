import Link from "next/link";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import type { Opportunity } from "@/types";

interface LandingListProps {
  heading: string;
  intro: string;
  items: Opportunity[];
  related: Array<{ href: string; label: string }>;
  emptyNote?: string;
}

export function LandingList({ heading, intro, items, related, emptyNote }: LandingListProps) {
  return (
    <div className="container-site py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-muted mb-4">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/opportunities" className="hover:text-ink">Opportunities</Link>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">{heading}</h1>
      <p className="mt-3 max-w-2xl text-muted leading-relaxed">{intro}</p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">{emptyNote ?? "No open opportunities in this view yet. Check back soon."}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((opportunity) => <OpportunityCard key={opportunity.slug} opportunity={opportunity} />)}
        </div>
      )}

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-ink">Related views</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {related.map((item) => <Link key={item.href} href={item.href} className="chip">{item.label}</Link>)}
        </div>
      </section>
    </div>
  );
}
