"use client";

import { useState, FormEvent } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  variant?: "light" | "dark";
}

export function NewsletterForm({ variant = "light" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const dark = variant === "dark";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Something went wrong");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
          dark ? "bg-white/10 text-white" : "bg-forest/10 text-forest"
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        Check your inbox to confirm your subscription.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl p-1.5",
          dark ? "bg-white/10 border border-white/20" : "bg-white border border-border shadow-sm"
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
          className={cn(
            "flex-1 min-w-0 bg-transparent py-2.5 px-3 text-sm focus:outline-none",
            dark ? "text-white placeholder:text-white/40" : "text-ink placeholder:text-muted"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60",
            dark
              ? "bg-gold text-ink hover:bg-gold-muted"
              : "bg-forest text-white hover:bg-forest-600"
          )}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>

      {status === "error" && (
        <p className={cn("flex items-center gap-1.5 text-xs", dark ? "text-red-300" : "text-red-500")}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
