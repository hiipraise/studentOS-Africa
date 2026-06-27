import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  center?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  className,
  center = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("flex flex-col gap-1", center && "items-center")}>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-forest">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-bold text-ink tracking-tight sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted mt-0.5 max-w-prose">{subtitle}</p>
        )}
      </div>

      {href && !center && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:text-forest-600 transition-colors shrink-0"
        >
          {hrefLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
