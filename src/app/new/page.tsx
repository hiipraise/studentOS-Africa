import type { Metadata } from "next";
import Link from "next/link";
import { getNewThisWeek } from "@/lib/data/opportunities";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "New this week",
  description: "The newest scholarships, fellowships, internships and grants added to StudentOS Africa this week.",
  alternates: { canonical: "/new" },
};

export default async function NewThisWeekPage() {
  let items: Awaited<ReturnType<typeof getNewThisWeek>> = [];
  try {
    items = await getNewThisWeek(30);
  } catch {
    items = [];
  }
  return (
    <div className="container-site py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-ink">New this week</h1>
      <p className="mt-2 max-w-2xl text-muted">Freshly reviewed opportunities, newest first. Scraped drafts only appear here once an editor publishes them.</p>
      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">No new listings yet this week. <Link href="/opportunities" className="underline">Browse all opportunities</Link>.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{items.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}</div>
      )}
    </div>
  );
}
