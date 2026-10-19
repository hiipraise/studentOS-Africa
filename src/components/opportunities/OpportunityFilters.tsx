"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityCategory } from "@/types";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";

const CATEGORIES: OpportunityCategory[] = [
  "Scholarship", "Internship", "Fellowship",
  "Competition", "Hackathon", "Grant", "Program",
];

export function OpportunityFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const currentCategory = searchParams.get("category") ?? "";
  const currentQ        = searchParams.get("q") ?? "";
  const currentCountry = searchParams.get("country") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1 on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
    if (searchRef.current) searchRef.current.value = "";
  }

  const hasFilters = currentCategory || currentQ || currentCountry;

  return (
    <div className={cn("flex flex-col gap-4 transition-opacity", isPending && "opacity-60 pointer-events-none")}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          defaultValue={currentQ}
          placeholder="Search opportunities..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("q", (e.target as HTMLInputElement).value.trim());
            }
          }}
          className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition"
        />
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-muted">Eligible country
        <select value={currentCountry} onChange={(event) => updateParam("country", event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink">
          <option value="">All African countries</option>
          {AFRICAN_COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParam("category", "")}
          className={cn("chip", !currentCategory && "chip-active")}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateParam("category", currentCategory === cat ? "" : cat)}
            className={cn("chip", currentCategory === cat && "chip-active")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted hover:text-ink transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
