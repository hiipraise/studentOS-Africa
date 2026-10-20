"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Turnstile } from "@/components/reports/Turnstile";

const inputClass =
  "rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest";

export function SuggestionForm() {
  const [kind, setKind] = useState<"opportunity" | "benefit" | "correction">("opportunity");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("");
  const [details, setDetails] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, url: url.trim() || undefined, country, details, submitterEmail: submitterEmail.trim() || undefined, website, startedAt, turnstileToken: turnstileToken || undefined }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error ?? "Could not save your suggestion");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your suggestion");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-forest" aria-hidden="true" />
        <p className="font-semibold text-ink">Thank you — it is in the review queue.</p>
        <p className="max-w-[36ch] text-sm text-muted">A person checks every suggestion against the official source before anything is published.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="suggestion-website">Website</label>
        <input id="suggestion-website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-ink">What are you sharing?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {([
            ["opportunity", "New opportunity"],
            ["benefit", "New benefit"],
            ["correction", "A correction"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${kind === value ? "border-forest bg-forest/8 text-forest" : "border-border bg-white text-muted hover:bg-sage"}`}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-title" className="text-sm font-medium text-ink">Title</label>
        <input id="suggestion-title" required value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Google Africa PhD Fellowship" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="suggestion-url" className="text-sm font-medium text-ink">Official link <span className="font-normal text-muted">(optional)</span></label>
          <input id="suggestion-url" type="url" value={url} maxLength={500} onChange={(event) => setUrl(event.target.value)} placeholder="https://" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="suggestion-country" className="text-sm font-medium text-ink">Country or region <span className="font-normal text-muted">(optional)</span></label>
          <input id="suggestion-country" value={country} maxLength={60} onChange={(event) => setCountry(event.target.value)} placeholder="e.g. Nigeria, or Africa-wide" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-details" className="text-sm font-medium text-ink">Why should students know about it?</label>
        <textarea id="suggestion-details" required minLength={20} maxLength={1500} rows={5} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Who is it for, what does it cover, and what should students watch out for? Links are removed; put the official URL above." className={`${inputClass} resize-none`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-email" className="text-sm font-medium text-ink">Email <span className="font-normal text-muted">(optional)</span></label>
        <input id="suggestion-email" type="email" autoComplete="email" value={submitterEmail} onChange={(event) => setSubmitterEmail(event.target.value)} placeholder="For credit or follow-up. Never shown publicly." className={inputClass} />
      </div>

      <Turnstile onToken={setTurnstileToken} />

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary justify-center disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Send for review"}
      </button>
    </form>
  );
}
