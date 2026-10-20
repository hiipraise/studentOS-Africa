import type { MetadataRoute } from "next";
import { getDb, Collections } from "@/lib/db";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://studentos.africa";

async function slugs(collection: string) {
  try {
    const db = await getDb();
    const rows = await db.collection(collection).find({ published: true }, { projection: { slug: 1, updatedAt: 1 } }).limit(5000).toArray();
    return rows;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [opportunities, benefits, tools, guides] = await Promise.all([
    slugs(Collections.opportunities),
    slugs(Collections.benefits),
    slugs(Collections.tools),
    slugs(Collections.guides),
  ]);
  const now = new Date();
  const staticRoutes = ["", "/opportunities", "/benefits", "/tools", "/guides", "/reports", "/reports/submit", "/finder", "/newsletter", "/closing-soon", "/new", "/suggest", "/deadlines", "/about", "/contact", "/privacy", "/terms"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/opportunities" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/opportunities" ? 0.9 : 0.7,
  }));

  for (const row of opportunities) {
    entries.push({ url: `${BASE}/opportunities/${row.slug}`, lastModified: row.updatedAt ?? now, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const row of benefits) entries.push({ url: `${BASE}/benefits/${row.slug}`, lastModified: row.updatedAt ?? now, changeFrequency: "monthly", priority: 0.6 });
  for (const row of tools) entries.push({ url: `${BASE}/tools/${row.slug}`, lastModified: row.updatedAt ?? now, changeFrequency: "monthly", priority: 0.5 });
  for (const row of guides) entries.push({ url: `${BASE}/guides/${row.slug}`, lastModified: row.updatedAt ?? now, changeFrequency: "monthly", priority: 0.6 });

  for (const [code] of AFRICAN_COUNTRIES) entries.push({ url: `${BASE}/opportunities/country/${code.toLowerCase()}`, lastModified: now, changeFrequency: "weekly", priority: 0.65 });
  for (const category of ["scholarship", "internship", "fellowship", "competition", "hackathon", "grant", "program"]) entries.push({ url: `${BASE}/opportunities/category/${category}`, lastModified: now, changeFrequency: "weekly", priority: 0.65 });
  for (const level of ["undergraduate", "postgraduate", "phd", "professional"]) entries.push({ url: `${BASE}/opportunities/level/${level}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });

  const date = new Date();
  for (let index = 0; index < 6; index++) {
    const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + index, 1));
    entries.push({ url: `${BASE}/deadlines/${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  }
  return entries;
}
