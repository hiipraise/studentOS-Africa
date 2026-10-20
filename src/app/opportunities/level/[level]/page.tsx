import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpportunities } from "@/lib/data/opportunities";
import { LandingList } from "@/components/opportunities/LandingList";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";

export const revalidate = 3600;

const LEVELS = {
  undergraduate: { label: "Undergraduate", intro: "Scholarships, internships and programmes open to current and incoming undergraduate students in Africa." },
  postgraduate: { label: "Postgraduate", intro: "Master's funding, fellowships and research opportunities for African postgraduate students." },
  phd: { label: "PhD", intro: "Doctoral funding, research fellowships and academic opportunities for African PhD candidates." },
  professional: { label: "Professional", intro: "Fellowships, grants and programmes for early-career professionals and graduates." },
} as const;

type Level = keyof typeof LEVELS;

export function generateStaticParams() {
  return Object.keys(LEVELS).map((level) => ({ level }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const level = (await params).level as Level;
  const entry = LEVELS[level];
  if (!entry) return { title: "Level not found" };
  return {
    title: `${entry.label} opportunities for African students`,
    description: entry.intro,
    alternates: { canonical: `/opportunities/level/${level}` },
  };
}

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const level = (await params).level as Level;
  const entry = LEVELS[level];
  if (!entry) notFound();
  let items: Awaited<ReturnType<typeof getOpportunities>>["items"] = [];
  try {
    ({ items } = await getOpportunities({ level, pageSize: 30 }));
  } catch {
    items = [];
  }
  if (!items.length) notFound();

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: "Home", url: appUrl("/") },
          { name: "Opportunities", url: appUrl("/opportunities") },
          { name: entry.label, url: appUrl(`/opportunities/level/${level}`) },
        ]),
        itemListJsonLd(`${entry.label} opportunities`, items.map((item) => ({ title: item.title, url: appUrl(`/opportunities/${item.slug}`) }))),
      ]} />
      <LandingList
        heading={`${entry.label} opportunities for African students`}
        intro={entry.intro}
        items={items}
        related={Object.entries(LEVELS).filter(([key]) => key !== level).map(([key, value]) => ({ href: `/opportunities/level/${key}`, label: value.label }))}
      />
    </>
  );
}
