"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Search } from "lucide-react";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/opportunities?q=${encodeURIComponent(q)}` : "/opportunities");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-2xl border border-border bg-white p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-forest transition-shadow"
    >
      <Search className="ml-3 h-4 w-4 text-muted shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search scholarships, internships, tools..."
        className="flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none min-w-0"
      />
      <button type="submit" className="btn-primary py-2.5 px-5 text-sm shrink-0">
        Search
      </button>
    </form>
  );
}
