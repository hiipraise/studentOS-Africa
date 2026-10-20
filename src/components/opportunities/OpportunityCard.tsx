import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";
import { DeadlineBadge } from "@/components/shared/DeadlineBadge";
import { truncate } from "@/lib/utils";
import type { Opportunity } from "@/types";
import { TrustMetadata } from "@/components/shared/TrustMetadata";
import { SaveButton } from "@/components/saved/SaveButton";
import { getOpportunityStatus, reopenLabel } from "@/lib/domain/status";

const CATEGORY_COLORS: Record<string, string> = {
  Scholarship:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Internship:   "bg-blue-50 text-blue-700 border-blue-200",
  Fellowship:   "bg-purple-50 text-purple-700 border-purple-200",
  Competition:  "bg-amber-50 text-amber-700 border-amber-200",
  Hackathon:    "bg-orange-50 text-orange-700 border-orange-200",
  Grant:        "bg-teal-50 text-teal-700 border-teal-200",
  Program:      "bg-rose-50 text-rose-700 border-rose-200",
};

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const {
    title, slug, description, category,
    countries, deadline, image,
  } = opportunity;

  const colorClass = CATEGORY_COLORS[category] ?? "bg-sage text-ink border-border";
  const status = getOpportunityStatus(opportunity);

  return (
    <article className="group card-base flex flex-col gap-3">
      {/* Image */}
      {image ? (
        <div className="relative h-36 w-full overflow-hidden rounded-lg bg-sage">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-36 w-full rounded-lg bg-sage flex items-center justify-center">
          <span className="text-3xl font-display italic text-forest/20 select-none">
            {category[0]}
          </span>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
        >
          {category}
        </span>
        <DeadlineBadge deadline={deadline} />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-ink text-[15px] leading-snug group-hover:text-forest transition-colors line-clamp-2">
        <Link href={`/opportunities/${slug}`} className="no-underline">{title}</Link>
      </h3>

      <p className="text-sm text-muted leading-relaxed line-clamp-2">{truncate(description, 120)}</p>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-forest">{status === "closed" ? `Closed · ${reopenLabel(opportunity.cycle) ?? "This opportunity has closed"}` : status === "upcoming" ? "Upcoming" : status === "rolling" ? "Rolling applications" : status === "unknown" ? "Status unverified" : "Open"}</p>
        <SaveButton slug={slug} title={title} deadline={(opportunity.cycle?.closesAt ?? deadline) ? new Date(opportunity.cycle?.closesAt ?? deadline!).toISOString() : null} compact />
      </div>
      <TrustMetadata slug={slug} verifiedAt={opportunity.verifiedAt} verifiedBy={opportunity.verifiedBy} sourceUrl={opportunity.source?.url ?? opportunity.officialLink} confidence={opportunity.confidence} staleAt={opportunity.verifiedAt} />

      {/* Countries */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <Globe className="h-3.5 w-3.5 text-muted shrink-0" aria-hidden="true" />
        <span className="text-xs text-muted truncate">
          {countries.slice(0, 3).join(", ")}
          {countries.length > 3 && ` +${countries.length - 3} more`}
        </span>
      </div>
    </article>
  );
}
