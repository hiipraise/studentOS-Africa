"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import type { TranslationKey } from "@/lib/i18n";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_LINKS: ReadonlyArray<{ href: string; key: TranslationKey }> = [
  { href: "/opportunities", key: "nav.opportunities" },
  { href: "/benefits", key: "nav.benefits" },
  { href: "/tools", key: "nav.tools" },
  { href: "/guides", key: "nav.guides" },
  { href: "/reports", key: "nav.reports" },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="StudentOS Africa home">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-white text-sm font-bold font-sans tracking-tight group-hover:bg-forest-600 transition-colors"
        aria-hidden="true"
      >
        S
      </span>
      <span className="font-sans font-bold text-[15px] tracking-tight text-ink leading-none">
        Student<span className="text-forest font-extrabold">OS</span>
        <span className="ml-1 text-muted font-normal text-xs hidden sm:inline">Africa</span>
      </span>
    </Link>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-canvas/95 backdrop-blur-sm transition-shadow duration-200",
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent",
      )}
    >
      <nav className="container-site flex h-16 items-center justify-between">
        <Logo />

        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, key }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active ? "text-forest bg-sage" : "text-ink/70 hover:text-ink hover:bg-sage",
                  )}
                >
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/finder"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-forest border border-forest/30 hover:bg-forest/5 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("nav.finder")}
          </Link>
          <Link href="/newsletter" className="btn-primary text-sm py-2 px-4">
            {t("nav.newsletter")}
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle />
          <button
            className="btn-ghost p-2 rounded-lg"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-canvas animate-fade-in">
          <ul className="container-site flex flex-col py-3 gap-0.5">
            {NAV_LINKS.map(({ href, key }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      active ? "text-forest bg-sage" : "text-ink/70 hover:text-ink hover:bg-sage",
                    )}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="container-site pb-5 flex flex-col gap-2.5">
            <Link
              href="/finder"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-forest border border-forest/40 hover:bg-forest/5 transition-colors"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("nav.finder")}
            </Link>
            <Link href="/newsletter" className="btn-primary justify-center py-2.5">
              {t("nav.newsletter")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
