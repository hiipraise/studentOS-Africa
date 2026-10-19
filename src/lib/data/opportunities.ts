import { getDb, Collections } from "@/lib/db";
import { safeRegex } from "@/lib/safe-query";
import type { Opportunity } from "@/types";
import { regionsForCountry } from "@/lib/domain/countries";

export async function getOpportunities({
  category,
  country,
  q,
  featured,
  page = 1,
  pageSize = 12,
  showClosed = false,
}: {
  category?: string;
  country?: string;
  q?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
  showClosed?: boolean;
} = {}) {
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { published: true };
  if (category) filter.category = category;
  const and: Record<string, unknown>[] = [];
  if (country) and.push({ $or: [{ countries: country.toUpperCase() }, { "eligibility.countries": country.toUpperCase() }, { "eligibility.regions": { $in: [...regionsForCountry(country), "GLOBAL"] } }] });
  if (!showClosed) and.push({ status: { $ne: "closed" }, $or: [
    { "cycle.closesAt": { $gte: new Date() } },
    { "cycle.closesAt": { $exists: false }, deadline: { $gte: new Date() } },
    { "cycle.closesAt": { $exists: false }, deadline: null },
    { status: "rolling" },
    { status: "upcoming", "cycle.opensAt": { $gt: new Date() } },
  ] });
  if (and.length) filter.$and = and;
  if (featured) filter.featured = true;
  if (q) {
    filter.$or = [
      { title:       { $regex: safeRegex(q), $options: "i" } },
      { description: { $regex: safeRegex(q), $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    col.aggregate<Opportunity>([
      { $match: filter },
      { $addFields: {
        _sortDeadline: { $ifNull: ["$cycle.closesAt", "$deadline"] },
        _sortStatus: { $switch: { branches: [
          { case: { $eq: ["$status", "closed"] }, then: 3 },
          { case: { $gt: [{ $ifNull: ["$cycle.opensAt", null] }, new Date()] }, then: 1 },
          { case: { $and: [{ $ne: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, { $lt: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, new Date()] }] }, then: 3 },
          { case: { $eq: ["$status", "upcoming"] }, then: 1 },
          { case: { $in: ["$status", ["open", "rolling"]] }, then: 0 },
          { case: { $and: [{ $eq: ["$status", null] }, { $ne: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, { $lt: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, new Date()] }] }, then: 3 },
          { case: { $eq: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, then: 2 },
        ], default: 0 } },
      } },
      { $sort: { _sortStatus: 1, _sortDeadline: 1, createdAt: -1 } },
      { $skip: (page - 1) * pageSize }, { $limit: pageSize },
      { $project: { _sortDeadline: 0, _sortStatus: 0 } },
    ]).toArray(),
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
    .find({ published: true, featured: true, status: { $ne: "closed" }, $or: [ { "cycle.closesAt": { $gte: new Date() } }, { "cycle.closesAt": { $exists: false }, deadline: { $gte: new Date() } }, { "cycle.closesAt": { $exists: false }, deadline: null }, { status: "rolling" }, { status: "upcoming", "cycle.opensAt": { $gt: new Date() } } ] })
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
