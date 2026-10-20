import { getDb, Collections } from "@/lib/db";
import type { Guide } from "@/types";

const LIST_PROJECTION = {
  title: 1, slug: 1, excerpt: 1, tags: 1,
  image: 1, readingTimeMinutes: 1, featured: 1, createdAt: 1,
};

export async function getGuides({
  tag,
  featured,
  page = 1,
  pageSize = 10,
}: { tag?: string; featured?: boolean; page?: number; pageSize?: number } = {}) {
  const db = await getDb();
  const col = db.collection<Guide>(Collections.guides);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { published: true };
  if (tag)      filter.tags = tag;
  if (featured) filter.featured = true;

  const [items, total] = await Promise.all([
    col
      .find(filter, { projection: LIST_PROJECTION })
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return { items, total, page, pageSize };
}

export async function getGuideBySlug(slug: string) {
  const db = await getDb();
  return db
    .collection<Guide>(Collections.guides)
    .findOne({ slug, published: true });
}

export async function getPublishedGuideSlugs(limit = 500) {
  const db = await getDb();
  return db
    .collection<Guide>(Collections.guides)
    .find({ published: true }, { projection: { slug: 1 } })
    .limit(limit)
    .toArray();
}

export async function getLatestGuides(limit = 4) {
  const db = await getDb();
  return db
    .collection<Guide>(Collections.guides)
    .find({ published: true }, { projection: LIST_PROJECTION })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
