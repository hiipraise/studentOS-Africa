import Link from "next/link";
import { OutdatedReportButton } from "@/components/shared/OutdatedReportButton";

function dateLabel(date?: Date | string) {
  if (!date) return "Not yet verified";
  const verified = new Date(date);
  if (!Number.isFinite(verified.getTime())) return "Not yet verified";
  const days = Math.floor((Date.now() - verified.getTime()) / 86_400_000);
  if (days > 45) return `Last checked ${verified.toLocaleDateString("en-NG", { dateStyle: "medium" })}`;
  if (days < 1) return "Verified today";
  if (days === 1) return "Verified yesterday";
  if (days < 30) return `Verified ${days} days ago`;
  return `Verified ${Math.floor(days / 30)} months ago`;
}

export function TrustMetadata({ slug, verifiedAt, verifiedBy, sourceUrl, confidence, staleAt }: { slug: string; verifiedAt?: Date | string; verifiedBy?: string; sourceUrl?: string; confidence?: string; staleAt?: Date | string }) {
  const isStale = !staleAt || Date.now() - new Date(staleAt).getTime() > 45 * 86_400_000;
  const verifier = verifiedAt ? ` by ${verifiedBy ?? "reviewer not recorded"}` : "";
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted" aria-label="Listing verification">
    <span>{isStale ? `May be outdated · ${dateLabel(staleAt)}${verifier}` : `${dateLabel(verifiedAt)}${verifier}`}</span>
    <span>Confidence: {confidence ?? "unverified"}</span>
    {sourceUrl && <Link href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Source</Link>}
    <OutdatedReportButton slug={slug} />
  </div>;
}
