import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolFilters } from "@/components/tools/ToolFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { getTools } from "@/lib/data/tools";
import { parsePage } from "@/lib/safe-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Student Tools",
  description: "AI, coding, design, research, and productivity tools every student should know about.",
};

interface PageProps {
  searchParams: Promise<{ category?: string; free?: string; page?: string }>;
}

export default async function ToolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 12;

  const { items, total } = await getTools({
    category: params.category,
    free: params.free === "true",
    page,
    pageSize,
  });

  return (
    <div className="container-site py-12 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
          Free Student Tools
        </h1>
        <p className="text-muted max-w-2xl">
          AI, coding, design, research, and productivity tools that make student life easier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={null}>
            <ToolFilters />
          </Suspense>
        </aside>

        <div>
          <p className="text-sm text-muted mb-4">
            {total} {total === 1 ? "tool" : "tools"} found
          </p>

          {items.length === 0 ? (
            <EmptyState
              title="No tools found"
              message="Try a different category or filter."
              href="/tools"
              hrefLabel="Clear filters"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
              <Suspense fallback={null}>
                <Pagination total={total} page={page} pageSize={pageSize} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
