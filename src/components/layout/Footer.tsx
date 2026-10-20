"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import type { TranslationKey } from "@/lib/i18n";

const FOOTER_GROUPS: ReadonlyArray<{ heading: TranslationKey; links: ReadonlyArray<{ key: TranslationKey; href: string }> }> = [
  {
    heading: "footer.platform",
    links: [
      { key: "nav.opportunities", href: "/opportunities" },
      { key: "nav.benefits", href: "/benefits" },
      { key: "nav.tools", href: "/tools" },
      { key: "nav.guides", href: "/guides" },
    ],
  },
  {
    heading: "footer.resources",
    links: [
      { key: "nav.finder", href: "/finder" },
      { key: "nav.reports", href: "/reports" },
      { key: "nav.newsletter", href: "/newsletter" },
      { key: "nav.saved", href: "/saved" },
    ],
  },
  {
    heading: "footer.company",
    links: [
      { key: "footer.about", href: "/about" },
      { key: "footer.contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLocale();

  return (
    <footer className="border-t border-border bg-ink text-white/80">
      <div className="container-site py-14 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-sm font-bold text-white">S</span>
              <span className="font-sans text-[15px] font-bold leading-none tracking-tight text-white">
                Student<span className="text-gold">OS</span>
                <span className="ml-1 text-xs font-normal text-white/50">Africa</span>
              </span>
            </div>

            <p className="max-w-[24ch] text-sm leading-relaxed text-white/50">{t("footer.tagline")}</p>

            <Link href="/newsletter" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-muted">
              {t("nav.newsletter")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {FOOTER_GROUPS.map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">{t(heading)}</p>
              <ul className="flex flex-col gap-2">
                {links.map(({ key, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/60 transition-colors hover:text-white">
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-white/30">© {year} StudentOS Africa. Built for students across the continent.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-white/30 transition-colors hover:text-white/60">{t("footer.privacy")}</Link>
            <Link href="/terms" className="text-xs text-white/30 transition-colors hover:text-white/60">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
