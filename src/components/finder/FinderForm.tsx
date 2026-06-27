"use client";

import { useState, FormEvent } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import type { FinderResult } from "@/types";

const LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate",  label: "Postgraduate" },
  { value: "phd",           label: "PhD" },
  { value: "professional",  label: "Professional" },
] as const;

const SUGGESTED_INTERESTS = [
  "AI & Machine Learning", "Web Development", "Data Science",
  "Design", "Entrepreneurship", "Climate", "Public Health", "Finance",
];

interface FinderFormProps {
  onResult: (result: FinderResult) => void;
}

export function FinderForm({ onResult }: FinderFormProps) {
  const [country, setCountry] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState<typeof LEVELS[number]["value"]>("undergraduate");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [careerGoal, setCareerGoal] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function addCustomInterest() {
    const val = customInterest.trim();
    if (val && !interests.includes(val)) {
      setInterests((prev) => [...prev, val]);
    }
    setCustomInterest("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (interests.length === 0) {
      setError("Add at least one interest");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, course, level, interests, careerGoal }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "AI Finder failed. Please try again.");
      }

      onResult(json.data as FinderResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Country + Course */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-ink">Country</label>
          <input
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Nigeria"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="course" className="text-sm font-medium text-ink">Course of study</label>
          <input
            id="course"
            required
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Computer Science"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Level</span>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              className={`chip ${level === l.value ? "chip-active" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Interests</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`chip ${interests.includes(interest) ? "chip-active" : ""}`}
            >
              {interest}
            </button>
          ))}
        </div>

        {/* Custom interest input */}
        <div className="flex items-center gap-2 mt-1">
          <input
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomInterest();
              }
            }}
            placeholder="Add a custom interest..."
            className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <button type="button" onClick={addCustomInterest} className="btn-ghost border border-border rounded-lg px-3 py-2 text-sm">
            Add
          </button>
        </div>

        {/* Selected custom interests not in suggested list */}
        {interests.filter((i) => !SUGGESTED_INTERESTS.includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {interests
              .filter((i) => !SUGGESTED_INTERESTS.includes(i))
              .map((interest) => (
                <span key={interest} className="chip-active inline-flex items-center gap-1.5">
                  {interest}
                  <button type="button" onClick={() => toggleInterest(interest)} aria-label={`Remove ${interest}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Career goal */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="careerGoal" className="text-sm font-medium text-ink">Career goal</label>
        <textarea
          id="careerGoal"
          required
          rows={3}
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          placeholder="e.g. I want to become a backend engineer at a fintech company"
          className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-gold justify-center disabled:opacity-60">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Finding your matches...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Find My Opportunities
          </>
        )}
      </button>
    </form>
  );
}
