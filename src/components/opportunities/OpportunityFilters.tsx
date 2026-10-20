"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";

const CATEGORIES = ["Scholarship", "Internship", "Fellowship", "Competition", "Hackathon", "Grant", "Program"];
const LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "phd", label: "PhD" },
  { value: "professional", label: "Professional" },
];
const FUNDING = [
  { value: "full", label: "Fully funded" },
  { value: "partial", label: "Partial" },
  { value: "stipend", label: "Stipend" },
];
const DEADLINES = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "Next 3 months" },
];
const STATUSES = [
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
  { value: "rolling", label: "Rolling" },
  { value: "closed", label: "Closed" },
];

interface OpportunityFiltersProps {
  fields?: string[];
  defaultCountry?: string;
}

export function OpportunityFilters({ fields = [], defaultCountry = "" }: OpportunityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value = (key: string) => searchParams.get(key) ?? "";
  const country = value("country") || defaultCountry;

  function updateParam(key: string, next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(key, next);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Debounced search-as-you-type with shareable URL state.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) updateParam("q", query.trim());
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeCount = ["q", "category", "country", "level", "field", "funding", "deadline", "status", "showClosed"].filter((key) => searchParams.get(key)).length;
  const hasFilters = activeCount > 0;

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search scholarships, fields, organisations..."
          aria-label="Search opportunities"
          className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition"
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="lg:hidden flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-ink"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters {activeCount > 0 && <span className="rounded-full bg-forest px-1.5 text-[11px] text-white">{activeCount}</span>}</span>
        <span className="text-muted text-xs">Tap to {open ? "hide" : "show"}</span>
      </button>

      <div className={cn("flex-col gap-4", open ? "flex" : "hidden lg:flex")}>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">Country
          <select value={country} onChange={(event) => updateParam("country", event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink">
            <option value="">All countries</option>
            {AFRICAN_COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => updateParam("category", "")} className={cn("chip", !value("category") && "chip-active")}>All</button>
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => updateParam("category", value("category") === category ? "" : category)} className={cn("chip", value("category") === category && "chip-active")}>{category}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Level
            <select value={value("level")} onChange={(event) => updateParam("level", event.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-2 text-sm text-ink">
              <option value="">Any level</option>
              {LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Funding
            <select value={value("funding")} onChange={(event) => updateParam("funding", event.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-2 text-sm text-ink">
              <option value="">Any funding</option>
              {FUNDING.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Deadline
            <select value={value("deadline")} onChange={(event) => updateParam("deadline", event.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-2 text-sm text-ink">
              <option value="">Any time</option>
              {DEADLINES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Status
            <select value={value("status")} onChange={(event) => updateParam("status", event.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-2 text-sm text-ink">
              <option value="">Open & upcoming</option>
              {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>

        {fields.length > 0 && (
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Field of study
            <select value={value("field")} onChange={(event) => updateParam("field", event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink">
              <option value="">Any field</option>
              {fields.map((field) => <option key={field} value={field}>{field}</option>)}
            </select>
          </label>
        )}

        {hasFilters && (
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted hover:text-ink transition-colors">
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
