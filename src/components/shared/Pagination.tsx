"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
}

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-10">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="btn-ghost rounded-lg p-2 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={cn(
              "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
              p === page
                ? "bg-forest text-white"
                : "text-muted hover:bg-sage hover:text-ink"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost rounded-lg p-2 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
