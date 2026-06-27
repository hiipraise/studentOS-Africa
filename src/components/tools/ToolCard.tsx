import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { truncate } from "@/lib/utils";
import type { Tool } from "@/types";

const CATEGORY_EMOJI: Record<string, string> = {
  AI:           "✦",
  Coding:       "{ }",
  Design:       "◈",
  Research:     "⊕",
  Productivity: "◎",
  Learning:     "◇",
};

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { title, slug, description, category, officialLink, image, free } = tool;

  return (
    <div className="group card-base flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {image ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
              <Image src={image} alt={`${title} logo`} fill className="object-contain p-1" sizes="36px" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage border border-border">
              <span className="text-xs font-mono text-forest/60">
                {CATEGORY_EMOJI[category] ?? "·"}
              </span>
            </div>
          )}
          <div>
            <Link
              href={`/tools/${slug}`}
              className="font-semibold text-ink text-[15px] leading-snug hover:text-forest transition-colors line-clamp-1"
            >
              {title}
            </Link>
            <span className="text-xs text-muted">{category}</span>
          </div>
        </div>

        {free && (
          <span className="shrink-0 rounded-full bg-forest/8 px-2 py-0.5 text-xs font-medium text-forest border border-forest/20">
            Free
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed line-clamp-2 flex-1">
        {truncate(description, 100)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Link href={`/tools/${slug}`} className="btn-ghost text-xs py-1.5 px-3 rounded-lg border border-border">
          Learn more
        </Link>
        <a
          href={officialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-forest-600 transition-colors ml-auto"
        >
          Open tool
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
