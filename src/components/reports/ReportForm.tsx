"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";
import type { ReportOutcome } from "@/types";
import { Turnstile } from "@/components/reports/Turnstile";

export interface BenefitOption {
  id: string;
  title: string;
}

interface ReportFormProps {
  benefits: BenefitOption[];
  schools?: string[];
  initialBenefitId?: string;
}

const OUTCOME_OPTIONS: { value: ReportOutcome; label: string; hint: string }[] = [
  { value: "worked", label: "It worked", hint: "I got the benefit" },
  { value: "partial", label: "Partly worked", hint: "Some steps failed" },
  { value: "failed", label: "It didn't work", hint: "I was blocked or rejected" },
];

const VERIFICATION_METHODS = [
  ["school-email", "School email"],
  ["student-id", "Student ID"],
  ["document", "Document upload"],
  ["other", "Other method"],
  ["none", "No verification needed"],
  ["unknown", "Not sure"],
] as const;

const inputClass =
  "rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest";

export function ReportForm({ benefits, schools = [], initialBenefitId = "" }: ReportFormProps) {
  const router = useRouter();
  const [benefitId, setBenefitId] = useState(initialBenefitId);
  const [school, setSchool] = useState("");
  const [country, setCountry] = useState("NG");
  const [outcome, setOutcome] = useState<ReportOutcome>("worked");
  const [verificationMethod, setVerificationMethod] = useState<string>("");
  const [timeToApproveDays, setTimeToApproveDays] = useState("");
  const [paymentIssue, setPaymentIssue] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [startedAt] = useState(() => Date.now());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedBenefit = useMemo(() => benefits.find((benefit) => benefit.id === benefitId), [benefitId, benefits]);
  const remaining = 1000 - comment.length;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefitId,
          outcome,
          country,
          school,
          verificationMethod: verificationMethod || undefined,
          timeToApproveDays: timeToApproveDays === "" ? null : Number(timeToApproveDays),
          paymentIssue: { occurred: paymentIssue, ...(paymentNotes.trim() ? { notes: paymentNotes.trim() } : {}) },
          reportDate,
          comment,
          submitterEmail: submitterEmail.trim() || undefined,
          website,
          startedAt,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
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
          <p className="text-sm text-muted max-w-[36ch]">
            Your report is in the moderation queue. It appears with the benefit once a human checks it.
            {submitterEmail ? " We will email you when it is reviewed." : ""}
          </p>
        </div>
        <button type="button" onClick={() => router.push("/reports")} className="btn-ghost rounded-lg border border-border px-4 py-2 text-sm">
          View all reports
        </button>
      </div>
    );
  }

  if (benefits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-sage/40 p-8 text-center text-sm text-muted">
        Benefits have not been published yet, so there is nothing to report on. Please check back soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate={false}>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="benefitId" className="text-sm font-medium text-ink">
          Which benefit is this about?
        </label>
        <select id="benefitId" required value={benefitId} onChange={(event) => setBenefitId(event.target.value)} className={inputClass}>
          <option value="">Choose a published benefit…</option>
          {benefits.map((benefit) => (
            <option key={benefit.id} value={benefit.id}>
              {benefit.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">Only benefits listed on StudentOS can be reviewed, so the title is always accurate.</p>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-ink">Did it work?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {OUTCOME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={outcome === option.value}
              onClick={() => setOutcome(option.value)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                outcome === option.value ? "border-forest bg-forest/8 text-forest" : "border-border bg-white text-muted hover:bg-sage"
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs opacity-80">{option.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="school" className="text-sm font-medium text-ink">
            Your school
          </label>
          <input
            id="school"
            required
            list="known-schools"
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            placeholder="e.g. University of Lagos"
            className={inputClass}
          />
          <datalist id="known-schools">
            {schools.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-ink">
            Country
          </label>
          <select id="country" required value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass}>
            {AFRICAN_COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="verificationMethod" className="text-sm font-medium text-ink">
            How did they verify you?
          </label>
          <select id="verificationMethod" value={verificationMethod} onChange={(event) => setVerificationMethod(event.target.value)} className={inputClass}>
            <option value="">Prefer not to say</option>
            {VERIFICATION_METHODS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timeToApproveDays" className="text-sm font-medium text-ink">
            Days until approval <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="timeToApproveDays"
            type="number"
            min={0}
            max={730}
            inputMode="numeric"
            value={timeToApproveDays}
            onChange={(event) => setTimeToApproveDays(event.target.value)}
            placeholder="e.g. 3"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" checked={paymentIssue} onChange={(event) => setPaymentIssue(event.target.checked)} className="mt-0.5" />
          I hit a payment or card problem
        </label>
        {paymentIssue && (
          <input
            aria-label="Payment problem details"
            value={paymentNotes}
            maxLength={500}
            onChange={(event) => setPaymentNotes(event.target.value)}
            placeholder="What happened? (e.g. card declined, needed a virtual dollar card)"
            className={inputClass}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reportDate" className="text-sm font-medium text-ink">
            When did this happen?
          </label>
          <input id="reportDate" type="date" max={new Date().toISOString().slice(0, 10)} value={reportDate} onChange={(event) => setReportDate(event.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="submitterEmail" className="text-sm font-medium text-ink">
            Email for the decision <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="submitterEmail"
            type="email"
            autoComplete="email"
            value={submitterEmail}
            onChange={(event) => setSubmitterEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
          <p className="text-xs text-muted">Never shown publicly. Used only to tell you if the report was published.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-ink">
          Tell us about your experience
        </label>
        <textarea
          id="comment"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What was the process like? What worked, what failed, and what should another student know? Links are removed."
          className={`${inputClass} resize-none`}
        />
        <p className={`text-xs ${remaining < 0 ? "text-red-600" : "text-muted"}`}>{remaining} characters left</p>
      </div>

      <Turnstile onToken={setTurnstileToken} />

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting || !selectedBenefit} className="btn-primary justify-center disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Submit report for review"}
      </button>
      <p className="text-xs text-muted">
        Reports are moderated. We only publish statistics when at least five reports exist, so one bad day never speaks for everyone.
      </p>
    </form>
  );
}
