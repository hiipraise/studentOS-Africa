import type { Metadata } from "next";
import Link from "next/link";
import { getClosingSoon } from "@/lib/data/opportunities";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { JsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Closing this week",
  description: "Opportunities closing in the next seven days for African students. Save the date before it passes.",
  alternates: { canonical: "/closing-soon" },
};

export default async function ClosingSoonPage() {
  let items: Awaited<ReturnType<typeof getClosingSoon>> = [];
  try {
    items = await getClosingSoon(30, 7);
  } catch {
    items = [];
  }
  return (
    <div className="container-site py-12 md:py-16">
      <JsonLd data={itemListJsonLd("Opportunities closing this week", items.map((item) => ({ title: item.title, url: appUrl(`/opportunities/${item.slug}`) })))} />
      <h1 className="text-3xl md:text-4xl font-bold text-ink">Closing this week</h1>
      <p className="mt-2 max-w-2xl text-muted">Seven days or fewer. Apply or save it to your tracker now — this page is designed to be shared.</p>
      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-white p-6 text-sm text-muted">Nothing closes in the next seven days. <Link href="/opportunities?deadline=month" className="underline">See what closes this month</Link>.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{items.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}</div>
      )}
    </div>
  );
}
