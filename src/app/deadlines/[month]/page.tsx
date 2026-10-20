import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpportunities } from "@/lib/data/opportunities";
import { LandingList } from "@/components/opportunities/LandingList";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";

export const revalidate = 3600;

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { year, month, from, to };
}

export function generateStaticParams() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1));
    return { month: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}` };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const parsed = parseMonth((await params).month);
  if (!parsed) return { title: "Deadline month not found" };
  const label = parsed.from.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return {
    title: `Opportunity deadlines in ${label}`,
    description: `Scholarships, fellowships, internships and grants closing in ${label} for African students.`,
    alternates: { canonical: `/deadlines/${(await params).month}` },
  };
}

export default async function DeadlineMonthPage({ params }: { params: Promise<{ month: string }> }) {
  const value = (await params).month;
  const parsed = parseMonth(value);
  if (!parsed) notFound();
  const label = parsed.from.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  let items: Awaited<ReturnType<typeof getOpportunities>>["items"] = [];
  try {
    ({ items } = await getOpportunities({ closesFrom: parsed.from.toISOString(), closesTo: parsed.to.toISOString(), pageSize: 40 }));
  } catch {
    items = [];
  }
  if (!items.length) notFound();

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: "Home", url: appUrl("/") },
          { name: "Deadlines", url: appUrl("/deadlines") },
          { name: label, url: appUrl(`/deadlines/${value}`) },
        ]),
        itemListJsonLd(`Opportunity deadlines in ${label}`, items.map((item) => ({ title: item.title, url: appUrl(`/opportunities/${item.slug}`) }))),
      ]} />
      <LandingList
        heading={`Opportunity deadlines in ${label}`}
        intro={`Every listing below has a confirmed closing date in ${label}. Dates are shown in UTC on cards; open a listing to see the programme's timezone.`}
        items={items}
        related={[
          { href: "/deadlines", label: "All deadlines" },
          { href: "/closing-soon", label: "Closing soon" },
          { href: "/opportunities", label: "All opportunities" },
        ]}
      />
    </>
  );
}
