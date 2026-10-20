"use client";

import { useState, FormEvent } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import type { FinderResult } from "@/types";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";

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

const COURSES = [
  "Computer Science", "Engineering", "Medicine", "Law", "Economics",
  "Accounting", "Agriculture", "Education", "Public Health", "Environmental Science",
  "Political Science", "Mathematics", "Physics", "Chemistry", "Biology",
  "Business Administration", "Journalism", "Architecture", "Pharmacy", "Nursing",
];

const ASSETS = ["CV", "Personal statement", "Referees", "Transcript", "Portfolio"];

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
  const [has, setHas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function addCustomInterest() {
    const value = customInterest.trim();
    if (value && !interests.includes(value)) setInterests((previous) => [...previous, value]);
    setCustomInterest("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (interests.length === 0) {
      setError("Add at least one interest");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, course, level, interests, careerGoal, has }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error ?? "AI Finder failed. Please try again.");
      onResult(json.data as FinderResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-ink">Country</label>
          <input
            id="country"
            required
            list="finder-countries"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Start typing, e.g. Nigeria"
            autoComplete="country-name"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <datalist id="finder-countries">
            {AFRICAN_COUNTRIES.map(([code, name]) => <option key={code} value={name} />)}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="course" className="text-sm font-medium text-ink">Course of study</label>
          <input
            id="course"
            required
            list="finder-courses"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            placeholder="e.g. Computer Science"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <datalist id="finder-courses">
            {COURSES.map((item) => <option key={item} value={item} />)}
          </datalist>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Level</span>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <button key={item.value} type="button" onClick={() => setLevel(item.value)} className={`chip ${level === item.value ? "chip-active" : ""}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Interests</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_INTERESTS.map((interest) => (
            <button key={interest} type="button" onClick={() => toggle(interests, interest, setInterests)} className={`chip ${interests.includes(interest) ? "chip-active" : ""}`}>
              {interest}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            value={customInterest}
            onChange={(event) => setCustomInterest(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomInterest();
              }
            }}
            placeholder="Add a custom interest..."
            className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <button type="button" onClick={addCustomInterest} className="btn-ghost border border-border rounded-lg px-3 py-2 text-sm">Add</button>
        </div>
        {interests.filter((interest) => !SUGGESTED_INTERESTS.includes(interest)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {interests.filter((interest) => !SUGGESTED_INTERESTS.includes(interest)).map((interest) => (
              <span key={interest} className="chip-active inline-flex items-center gap-1.5">
                {interest}
                <button type="button" onClick={() => toggle(interests, interest, setInterests)} aria-label={`Remove ${interest}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="careerGoal" className="text-sm font-medium text-ink">Career goal</label>
        <textarea
          id="careerGoal"
          required
          rows={3}
          value={careerGoal}
          onChange={(event) => setCareerGoal(event.target.value)}
          placeholder="e.g. I want to become a backend engineer at a fintech company"
          className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">What I already have <span className="font-normal text-muted">(optional)</span></span>
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((asset) => (
            <button key={asset} type="button" onClick={() => toggle(has, asset, setHas)} className={`chip ${has.includes(asset) ? "chip-active" : ""}`}>{asset}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-gold justify-center disabled:opacity-60">
        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Finding your matches...</>) : (<><Sparkles className="h-4 w-4" aria-hidden="true" />Find My Opportunities</>)}
      </button>
    </form>
  );
}
