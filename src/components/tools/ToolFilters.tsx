"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { ToolCategory } from "@/types";

const CATEGORIES: ToolCategory[] = [
  "AI", "Coding", "Design", "Research", "Productivity", "Learning",
];

export function ToolFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") ?? "";
  const freeOnly = searchParams.get("free") === "true";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={cn("flex flex-col gap-3 transition-opacity", isPending && "opacity-60 pointer-events-none")}>
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

      <label className="inline-flex items-center gap-2 self-start text-sm text-ink cursor-pointer select-none">
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={(e) => updateParam("free", e.target.checked ? "true" : "")}
          className="h-4 w-4 rounded border-border text-forest focus:ring-forest"
        />
        Free tools only
      </label>
    </div>
  );
}
