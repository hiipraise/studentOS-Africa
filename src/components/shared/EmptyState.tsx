import Link from "next/link";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  href?: string;
  hrefLabel?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  message = "Try adjusting your filters or check back soon.",
  href,
  hrefLabel = "Clear filters",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-sage/40 py-20 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-muted">
        <SearchX className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted max-w-[34ch]">{message}</p>
      </div>
      {href && (
        <Link href={href} className="btn-ghost text-sm border border-border rounded-lg px-4 py-2">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
