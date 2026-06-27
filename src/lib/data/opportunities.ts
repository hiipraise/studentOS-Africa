import { getDb, Collections } from "@/lib/db";
import type { Opportunity } from "@/types";

export async function getOpportunities({
  category,
  country,
  q,
  featured,
  page = 1,
  pageSize = 12,
}: {
  category?: string;
  country?: string;
  q?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { published: true };
  if (category) filter.category = category;
  if (country) filter.countries = country;
  if (featured) filter.featured = true;
  if (q) {
    filter.$or = [
      { title:       { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

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

export async function getOpportunityBySlug(slug: string) {
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .findOne({ slug, published: true });
}

export async function getFeaturedOpportunities(limit = 6) {
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({ published: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getTrendingOpportunities(limit = 6) {
  // "Trending" = published, not expired, sorted by closest deadline
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({
      published: true,
      $or: [
        { deadline: { $gte: new Date() } },
        { deadline: null },
      ],
    })
    .sort({ deadline: 1, createdAt: -1 })
    .limit(limit)
    .toArray();
}
