import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOpportunities } from "@/lib/data/opportunities";
import { COUNTRY_BY_CODE, AFRICAN_COUNTRIES } from "@/lib/domain/countries";
import { LandingList } from "@/components/opportunities/LandingList";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { appUrl } from "@/lib/tokens";

export const revalidate = 3600;
export const dynamicParams = true;

const PRIORITY = ["NG", "KE", "GH", "ZA", "EG", "ET", "UG", "TZ", "CM", "SN"];

export function generateStaticParams() {
  return PRIORITY.map((code) => ({ code: code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const code = (await params).code.toUpperCase();
  const name = COUNTRY_BY_CODE.get(code);
  if (!name) return { title: "Country not found" };
  return {
    title: `Scholarships and opportunities for students in ${name}`,
    description: `Open scholarships, internships, fellowships and grants available to students in ${name}. Filtered for eligibility, with deadlines and official links.`,
    alternates: { canonical: `/opportunities/country/${code.toLowerCase()}` },
    openGraph: { title: `Opportunities for ${name}`, description: `Open opportunities eligible for students in ${name}.` },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  const name = COUNTRY_BY_CODE.get(code);
  if (!name) notFound();
  let items: Awaited<ReturnType<typeof getOpportunities>>["items"] = [];
  try {
    ({ items } = await getOpportunities({ country: code, pageSize: 30 }));
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
          { name: name, url: appUrl(`/opportunities/country/${code.toLowerCase()}`) },
        ]),
        itemListJsonLd(`Opportunities for students in ${name}`, items.map((item) => ({ title: item.title, url: appUrl(`/opportunities/${item.slug}`) }))),
      ]} />
      <LandingList
        heading={`Opportunities for students in ${name}`}
        intro={`These listings are open to applicants from ${name}, or are Africa-wide/global programmes. Every card links to the official page so you can confirm eligibility before applying.`}
        items={items}
        related={[
          { href: "/closing-soon", label: "Closing soon" },
          { href: "/opportunities?level=postgraduate", label: "Postgraduate" },
          { href: "/deadlines", label: "Deadline calendar" },
          ...AFRICAN_COUNTRIES.filter(([other]) => other !== code).slice(0, 6).map(([other, otherName]) => ({ href: `/opportunities/country/${other.toLowerCase()}`, label: otherName })),
        ]}
      />
    </>
  );
}
