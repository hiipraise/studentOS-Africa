import { getDb, Collections } from "@/lib/db";
import type { Tool } from "@/types";

export async function getTools({
  category,
  free,
  featured,
  page = 1,
  pageSize = 12,
}: {
  category?: string;
  free?: boolean;
  featured?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const db = await getDb();
  const col = db.collection<Tool>(Collections.tools);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { published: true };
  if (category) filter.category = category;
  if (free)     filter.free = true;
  if (featured) filter.featured = true;

  const [items, total] = await Promise.all([
    col
      .find(filter)
      .sort({ featured: -1, category: 1, title: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return { items, total, page, pageSize };
}

export async function getToolBySlug(slug: string) {
  const db = await getDb();
  return db
    .collection<Tool>(Collections.tools)
    .findOne({ slug, published: true });
}

export async function getFeaturedTools(limit = 4) {
  const db = await getDb();
  return db
    .collection<Tool>(Collections.tools)
    .find({ published: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
