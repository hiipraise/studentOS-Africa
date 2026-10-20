"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/use-locale";

/** FR/EN toggle for the main journeys. Listings keep their source language. */
export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const next = locale === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-sage hover:text-ink"
      aria-label={locale === "fr" ? "Passer en anglais" : "Passer en français"}
      title={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
      {locale === "fr" ? "EN" : "FR"}
    </button>
  );
}
