import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// ─── Footer link groups ───────────────────────────────────────────────────────

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { label: "Opportunities", href: "/opportunities" },
      { label: "Benefits",      href: "/benefits" },
      { label: "Tools",         href: "/tools" },
      { label: "Guides",        href: "/guides" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "AI Finder",         href: "/finder" },
      { label: "Community Reports", href: "/reports" },
      { label: "Newsletter",        href: "/newsletter" },
      { label: "Submit a Report",   href: "/reports/submit" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",   href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-ink text-white/80">
      {/* Main footer grid */}
      <div className="container-site py-14 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-white text-sm font-bold">
                S
              </span>
              <span className="font-sans font-bold text-[15px] tracking-tight text-white leading-none">
                Student<span className="text-gold">OS</span>
                <span className="ml-1 text-white/50 font-normal text-xs">Africa</span>
              </span>
            </div>

            <p className="text-sm text-white/50 leading-relaxed max-w-[22ch]">
              Discover scholarships, internships, fellowships, and student benefits built for Africa.
            </p>

            {/* Newsletter mini CTA */}
            <Link
              href="/newsletter"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-muted transition-colors"
            >
              Join the weekly newsletter
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                {heading}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col sm:flex-row items-center justify-between gap-3 py-5">
          <p className="text-xs text-white/30">
            © {year} StudentOS Africa. Built for students across the continent.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
