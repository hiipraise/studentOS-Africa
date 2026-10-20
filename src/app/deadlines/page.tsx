import type { Metadata } from "next";
import Link from "next/link";
import { getClosingSoon, getNewThisWeek } from "@/lib/data/opportunities";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Scholarship and opportunity deadlines",
  description: "A month-by-month calendar of scholarship, fellowship and internship deadlines for African students.",
  alternates: { canonical: "/deadlines" },
};

function monthValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function DeadlinesPage() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1));
    return { value: monthValue(date), label: date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) };
  });
  let closing: Awaited<ReturnType<typeof getClosingSoon>> = [];
  let fresh: Awaited<ReturnType<typeof getNewThisWeek>> = [];
  try {
    [closing, fresh] = await Promise.all([getClosingSoon(6, 30), getNewThisWeek(6)]);
  } catch {
    // Database unavailable at build time.
  }

  return (
    <div className="container-site py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-ink">Deadline calendar</h1>
      <p className="mt-2 max-w-2xl text-muted">Plan around real closing dates. Each month lists open opportunities with a confirmed deadline.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {months.map((month) => <Link key={month.value} href={`/deadlines/${month.value}`} className="chip">{month.label}</Link>)}
      </div>

      {closing.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Closing in the next 30 days</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{closing.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}</div>
        </section>
      )}

      {fresh.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink">New this week</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{fresh.map((item) => <OpportunityCard key={item.slug} opportunity={item} />)}</div>
        </section>
      )}
    </div>
  );
}
