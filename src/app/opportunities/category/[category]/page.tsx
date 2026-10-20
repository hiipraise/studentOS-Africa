import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpportunities } from "@/lib/data/opportunities";
import { LandingList } from "@/components/opportunities/LandingList";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";

export const revalidate = 3600;

const CATEGORIES = {
  scholarship: { label: "Scholarships", value: "Scholarship", intro: "Funded study opportunities for African students, from tuition waivers to fully funded postgraduate programmes." },
  internship: { label: "Internships", value: "Internship", intro: "Paid and unpaid internships that give African students real work experience." },
  fellowship: { label: "Fellowships", value: "Fellowship", intro: "Leadership, research and professional fellowships open to African students and graduates." },
  competition: { label: "Competitions", value: "Competition", intro: "Competitions with cash prizes, recognition and acceleration for African students." },
  hackathon: { label: "Hackathons", value: "Hackathon", intro: "Hackathons and build challenges for student developers and designers across Africa." },
  grant: { label: "Grants", value: "Grant", intro: "Grants for student projects, research and early-stage ventures." },
  program: { label: "Programmes", value: "Program", intro: "Training programmes, bootcamps and cohort-based opportunities for African students." },
} as const;

type Slug = keyof typeof CATEGORIES;

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const slug = (await params).category as Slug;
  const entry = CATEGORIES[slug];
  if (!entry) return { title: "Category not found" };
  return {
    title: `${entry.label} for African students`,
    description: `${entry.intro} Browse open ${entry.label.toLowerCase()} with deadlines and official application links.`,
    alternates: { canonical: `/opportunities/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const slug = (await params).category as Slug;
  const entry = CATEGORIES[slug];
  if (!entry) notFound();
  let items: Awaited<ReturnType<typeof getOpportunities>>["items"] = [];
  try {
    ({ items } = await getOpportunities({ category: entry.value, pageSize: 30 }));
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
          { name: entry.label, url: appUrl(`/opportunities/category/${slug}`) },
        ]),
        itemListJsonLd(`${entry.label} for African students`, items.map((item) => ({ title: item.title, url: appUrl(`/opportunities/${item.slug}`) }))),
      ]} />
      <LandingList
        heading={`${entry.label} for African students`}
        intro={entry.intro}
        items={items}
        related={Object.entries(CATEGORIES).filter(([key]) => key !== slug).map(([key, value]) => ({ href: `/opportunities/category/${key}`, label: value.label }))}
      />
    </>
  );
}
