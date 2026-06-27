"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ReportStatus } from "@/types";

interface ReportFormProps {
  initialBenefitId?: string;
  initialBenefitTitle?: string;
}

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "approved", label: "It worked for me" },
  { value: "rejected", label: "It didn't work" },
];

export function ReportForm({ initialBenefitId = "", initialBenefitTitle = "" }: ReportFormProps) {
  const router = useRouter();
  const [benefitId, setBenefitId] = useState(initialBenefitId);
  const [benefitTitle, setBenefitTitle] = useState(initialBenefitTitle);
  const [school, setSchool] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<ReportStatus>("approved");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benefitId, benefitTitle, school, country, status, comment }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Something went wrong");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 text-forest">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-ink">Thanks for sharing!</p>
          <p className="text-sm text-muted max-w-[34ch]">
            Your report is pending review and will appear once approved.
          </p>
        </div>
        <button onClick={() => router.push("/reports")} className="btn-ghost border border-border rounded-lg px-4 py-2 text-sm">
          View all reports
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Benefit title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="benefitTitle" className="text-sm font-medium text-ink">
          Which benefit is this about?
        </label>
        <input
          id="benefitTitle"
          required
          value={benefitTitle}
          onChange={(e) => setBenefitTitle(e.target.value)}
          placeholder="e.g. GitHub Student Pack"
          className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
        />
        {/* Hidden benefitId kept in sync if prefilled from a benefit page */}
        <input type="hidden" value={benefitId} onChange={() => setBenefitId(benefitId)} />
      </div>

      {/* School + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="school" className="text-sm font-medium text-ink">
            Your school
          </label>
          <input
            id="school"
            required
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g. University of Lagos"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-ink">
            Country
          </label>
          <input
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Nigeria"
            className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Did it work?</span>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                status === opt.value
                  ? "border-forest bg-forest/8 text-forest"
                  : "border-border bg-white text-muted hover:bg-sage"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-ink">
          Tell us about your experience
        </label>
        <textarea
          id="comment"
          required
          minLength={10}
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was the process like? Any tips for other students?"
          className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest resize-none"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary justify-center disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Submit Report"}
      </button>
    </form>
  );
}
