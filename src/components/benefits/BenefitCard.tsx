import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { truncate } from "@/lib/utils";
import type { Benefit } from "@/types";

interface BenefitCardProps {
  benefit: Benefit;
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  const { title, slug, description, eligibility, image } = benefit;

  return (
    <Link
      href={`/benefits/${slug}`}
      className="group card-base flex flex-col gap-3 no-underline"
    >
      {/* Logo/Image */}
      <div className="flex items-center gap-3">
        {image ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
            <Image
              src={image}
              alt={`${title} logo`}
              fill
              className="object-contain p-1"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage border border-border">
            <span className="text-sm font-bold text-forest">
              {title[0]}
            </span>
          </div>
        )}
        <h3 className="font-semibold text-ink text-[15px] leading-snug group-hover:text-forest transition-colors line-clamp-1">
          {title}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed line-clamp-2">
        {truncate(description, 110)}
      </p>

      {/* Eligibility */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted line-clamp-1">
          {truncate(eligibility, 50)}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-forest opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all shrink-0"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
