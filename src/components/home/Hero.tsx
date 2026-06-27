"use client";

import { useState, useEffect } from "react";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";

const WORDS = ["Scholarships.", "Fellowships.", "Internships.", "Grants.", "Hackathons."];
const CYCLE_MS = 2200;

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-canvas">
      {/* Background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--sos-border) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />
      {/* Soft gradient blob */}
      <div
        className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-forest/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-40 left-[-15%] h-[320px] w-[320px] rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-site relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center gap-6">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-forest/5 px-4 py-1.5 text-xs font-semibold text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse-slow" aria-hidden="true" />
            Built for African students
          </span>

          {/* Headline with cycling word */}
          <h1 className="font-sans text-display-md sm:text-display-lg md:text-display-xl font-extrabold text-ink tracking-tight leading-[1.05]">
            Discover{" "}
            <span className="relative inline-block min-w-[1px] align-baseline">
              <span
                key={index}
                className="font-display italic text-forest animate-fade-in"
              >
                {WORDS[index]}
              </span>
            </span>
            <br />
            Built for Africa.
          </h1>

          {/* Subhead */}
          <p className="max-w-xl text-base md:text-lg text-muted leading-relaxed">
            Scholarships, internships, fellowships, student benefits, and free tools —
            all in one place, curated for students across the continent.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-xl pt-2">
            <HomeSearchBar />
          </div>

          {/* Quick stats / trust */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted">
            <span>🎓 Scholarships across 30+ countries</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>🛠️ Free student tools</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>📬 Weekly opportunity drops</span>
          </div>
        </div>
      </div>
    </section>
  );
}
