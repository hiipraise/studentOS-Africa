"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FinderForm } from "@/components/finder/FinderForm";
import { FinderResults } from "@/components/finder/FinderResults";
import type { FinderResult } from "@/types";

export default function FinderPage() {
  const [result, setResult] = useState<FinderResult | null>(null);

  return (
    <div className="container-site py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-Powered
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
            Find Your Perfect Opportunities
          </h1>
          <p className="text-muted max-w-md">
            Tell us about yourself and we&apos;ll match you with scholarships, benefits, tools,
            and guides tailored to your profile.
          </p>
        </div>

        {result ? (
          <FinderResults result={result} onReset={() => setResult(null)} />
        ) : (
          <div className="card-base p-6 md:p-8">
            <FinderForm onResult={setResult} />
          </div>
        )}
      </div>
    </div>
  );
}
