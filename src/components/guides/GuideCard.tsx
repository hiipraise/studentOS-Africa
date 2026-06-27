import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { truncate } from "@/lib/utils";
import type { Guide } from "@/types";

interface GuideCardProps {
  guide: Partial<Guide>;
  featured?: boolean;
}

export function GuideCard({ guide, featured = false }: GuideCardProps) {
  const { title, slug, excerpt, tags, image, readingTimeMinutes } = guide;

  if (featured) {
    return (
      <Link
        href={`/guides/${slug}`}
        className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border bg-ink min-h-[280px] no-underline"
      >
        {image ? (
          <Image
            src={image}
            alt={title ?? ""}
            fill
            className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-forest-800 to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

        <div className="relative p-6 flex flex-col gap-2">
          {tags?.[0] && (
            <span className="self-start rounded-full bg-gold/90 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {tags[0]}
            </span>
          )}
          <h3 className="font-display text-2xl text-white leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {readingTimeMinutes} min read
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/guides/${slug}`}
      className="group card-base flex flex-col gap-3 no-underline"
    >
      {image && (
        <div className="relative h-36 w-full overflow-hidden rounded-lg bg-sage">
          <Image
            src={image}
            alt={title ?? ""}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-sage px-2 py-0.5 text-xs font-medium text-forest">
            {tag}
          </span>
        ))}
      </div>

      <h3 className="font-semibold text-ink text-[15px] leading-snug group-hover:text-forest transition-colors line-clamp-2">
        {title}
      </h3>

      <p className="text-sm text-muted leading-relaxed line-clamp-2">
        {truncate(excerpt ?? "", 110)}
      </p>

      <div className="flex items-center gap-1.5 mt-auto pt-1 text-xs text-muted">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {readingTimeMinutes} min read
      </div>
    </Link>
  );
}
