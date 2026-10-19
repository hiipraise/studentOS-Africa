import type { Metadata } from "next";
import { Suspense } from "react";
import { GuideCard } from "@/components/guides/GuideCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { getGuides } from "@/lib/data/guides";
import { parsePage } from "@/lib/safe-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guides",
  description: "Step-by-step guides for claiming student benefits, winning scholarships, and finding free tools.",
};

interface PageProps {
  searchParams: Promise<{ tag?: string; page?: string }>;
}

export default async function GuidesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 10;

  const { items, total } = await getGuides({ tag: params.tag, page, pageSize });

  return (
    <div className="container-site py-12 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">Guides</h1>
        <p className="text-muted max-w-2xl">
          Step-by-step walkthroughs for claiming benefits, winning scholarship applications,
          and getting the most out of free student tools.
        </p>
      </div>

      <p className="text-sm text-muted mb-4">
        {total} {total === 1 ? "guide" : "guides"} published
      </p>

      {items.length === 0 ? (
        <EmptyState title="No guides found" message="Check back soon — guides are published regularly." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((g) => (
              <GuideCard key={g.slug} guide={g} />
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
