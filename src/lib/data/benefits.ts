import { getDb, Collections } from "@/lib/db";
import type { Benefit, Report } from "@/types";
import { APPROVED_REPORT_FILTER } from "@/lib/reports";
import { computeAvailability, computeReportStats } from "@/lib/domain/report-stats";

export async function getBenefits({
  featured,
  page = 1,
  pageSize = 12,
}: { featured?: boolean; page?: number; pageSize?: number } = {}) {
  const db = await getDb();
  const col = db.collection<Benefit>(Collections.benefits);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { published: true };
  if (featured) filter.featured = true;

  const [items, total] = await Promise.all([
    col
      .find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return { items, total, page, pageSize };
}

export async function getBenefitBySlug(slug: string) {
  const db = await getDb();
  const benefit = await db
    .collection<Benefit>(Collections.benefits)
    .findOne({ slug, published: true });

  if (!benefit) return null;

  const ids = [benefit._id?.toString(), benefit.slug].filter((value): value is string => Boolean(value));
  const reports = await db
    .collection<Report>(Collections.reports)
    .find({ ...APPROVED_REPORT_FILTER, benefitId: { $in: ids } })
    .sort({ reportDate: -1, createdAt: -1 })
    .limit(50)
    .toArray();

  const stats = computeReportStats(reports);
  const availability = computeAvailability(benefit, reports);

  return { benefit, reports, stats, availability };
}

export async function getFeaturedBenefits(limit = 4) {
  const db = await getDb();
  return db
    .collection<Benefit>(Collections.benefits)
    .find({ published: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
