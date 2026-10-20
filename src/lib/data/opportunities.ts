import { getDb, Collections } from "@/lib/db";
import type { Opportunity } from "@/types";
import { searchOpportunities, type OpportunitySearchInput } from "@/lib/search";

export type GetOpportunitiesInput = OpportunitySearchInput;

/** Main public list/search entry point. Falls back gracefully at every layer. */
export async function getOpportunities(input: GetOpportunitiesInput = {}) {
  return searchOpportunities(input);
}

export async function getOpportunityBySlug(slug: string) {
  const db = await getDb();
  return db.collection<Opportunity>(Collections.opportunities).findOne({ slug, published: true });
}

export async function getOpportunityBySlugOrDraft(slug: string) {
  const db = await getDb();
  return db.collection<Opportunity>(Collections.opportunities).findOne({ slug });
}

export async function getFeaturedOpportunities(limit = 6) {
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({ published: true, featured: true, status: { $ne: "closed" }, $or: [ { "cycle.closesAt": { $gte: new Date() } }, { "cycle.closesAt": { $exists: false }, deadline: { $gte: new Date() } }, { "cycle.closesAt": { $exists: false }, deadline: null }, { status: "rolling" }, { status: "upcoming", "cycle.opensAt": { $gt: new Date() } } ] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getTrendingOpportunities(limit = 6) {
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({
      published: true,
      status: { $ne: "closed" },
      $or: [
        { "cycle.closesAt": { $gte: new Date() } },
        { "cycle.closesAt": { $exists: false }, deadline: { $gte: new Date() } },
        { "cycle.closesAt": { $exists: false }, deadline: null },
        { status: "rolling" },
        { status: "upcoming", "cycle.opensAt": { $gt: new Date() } },
      ],
    })
    .sort({ deadline: 1, createdAt: -1 })
    .limit(limit)
    .toArray();
}

/** Items whose deadline falls inside the next `days` days. */
export async function getClosingSoon(limit = 12, days = 7) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 86400000);
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({
      published: true,
      status: { $ne: "closed" },
      $or: [
        { "cycle.closesAt": { $gte: now, $lte: end } },
        { "cycle.closesAt": { $exists: false }, deadline: { $gte: now, $lte: end } },
      ],
    })
    .sort({ "cycle.closesAt": 1, deadline: 1 })
    .limit(limit)
    .toArray();
}

/** Items first seen or created in the last seven days. */
export async function getNewThisWeek(limit = 12) {
  const since = new Date(Date.now() - 7 * 86400000);
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({ published: true, $or: [{ firstSeenAt: { $gte: since } }, { createdAt: { $gte: since } }] })
    .sort({ firstSeenAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
}

/** Related opportunities by category, country or field, excluding the current slug. */
export async function getRelatedOpportunities(opportunity: Pick<Opportunity, "slug" | "category" | "countries" | "eligibility">, limit = 4) {
  const db = await getDb();
  const now = new Date();
  const countryCodes = opportunity.eligibility?.countries ?? [];
  const fields = opportunity.eligibility?.fields ?? [];
  const or: Record<string, unknown>[] = [{ category: opportunity.category }];
  if (countryCodes.length) or.push({ "eligibility.countries": { $in: countryCodes } });
  if (fields.length) or.push({ "eligibility.fields": { $in: fields } });
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({
      published: true,
      slug: { $ne: opportunity.slug },
      status: { $ne: "closed" },
      $and: [
        { $or: or },
        {
          $or: [
            { "cycle.closesAt": { $gte: now } },
            { "cycle.closesAt": { $exists: false }, deadline: { $gte: now } },
            { "cycle.closesAt": { $exists: false }, deadline: null },
            { status: "rolling" },
          ],
        },
      ],
    })
    .sort({ "cycle.closesAt": 1, deadline: 1 })
    .limit(limit)
    .toArray();
}

/** Published slugs for generateStaticParams / sitemap. */
export async function getPublishedSlugs(limit = 2000) {
  const db = await getDb();
  return db
    .collection<Opportunity>(Collections.opportunities)
    .find({ published: true }, { projection: { slug: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
}

/** Distinct facet values for the filter bar. */
export async function getOpportunityFacets() {
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const [fields, categories] = await Promise.all([
    col.distinct("eligibility.fields", { published: true }),
    col.distinct("category", { published: true }),
  ]);
  return {
    fields: (fields as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    categories: categories as string[],
  };
}
