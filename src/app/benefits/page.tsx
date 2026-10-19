import type { Metadata } from "next";
import { Suspense } from "react";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { getBenefits } from "@/lib/data/benefits";
import { parsePage } from "@/lib/safe-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Benefits",
  description:
    "GitHub Student Pack, JetBrains, Notion, Canva, and more free student benefits for African students.",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BenefitsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 12;

  const { items, total } = await getBenefits({ page, pageSize });

  return (
    <div className="container-site py-12 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
          Student Benefits
        </h1>
        <p className="text-muted max-w-2xl">
          Free upgrades and discounts available to verified students — GitHub Student Pack,
          JetBrains, Notion, Canva, and more.
        </p>
      </div>

      <p className="text-sm text-muted mb-4">
        {total} {total === 1 ? "benefit" : "benefits"} available
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="No benefits found"
          message="Check back soon — student benefits are added regularly."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((b) => (
              <BenefitCard key={b.slug} benefit={b} />
            ))}
          </div>
          <Suspense fallback={null}>
            <Pagination total={total} page={page} pageSize={pageSize} />
          </Suspense>
        </>
      )}
    </div>
  );
}
