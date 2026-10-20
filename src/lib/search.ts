import type { Document } from "mongodb";
import { getDb, Collections } from "@/lib/db";
import { escapeRegExp } from "@/lib/escape";
import { parseSearchText } from "@/lib/safe-query";
import { regionsForCountry } from "@/lib/domain/countries";
import type { Opportunity } from "@/types";

export const ATLAS_INDEX = "opportunities_search";
export type SearchEngine = "atlas" | "text" | "regex" | "mongo";

export interface OpportunitySearchInput {
  q?: string;
  category?: string;
  country?: string;
  level?: string;
  field?: string;
  funding?: string;
  deadline?: "week" | "month" | "quarter" | string;
  /** Explicit ISO date bounds used by /deadlines/[yyyy-mm]. */
  closesFrom?: string;
  closesTo?: string;
  status?: string;
  showClosed?: boolean;
  featured?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "deadline" | "recent";
}

export interface OpportunitySearchResult {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  engine: SearchEngine;
}

/**
 * Atlas Search is a paid-tier feature on some Atlas plans. Probe once, then
 * remember the result briefly so a missing index never slows every request.
 */
let atlasState: { available: boolean; checkedAt: number } = { available: true, checkedAt: 0 };
const ATLAS_PROBE_TTL = 10 * 60 * 1000;

export function markAtlasUnavailable() {
  atlasState = { available: false, checkedAt: Date.now() };
}

export function resetAtlasState() {
  atlasState = { available: true, checkedAt: 0 };
}

function atlasUsable() {
  return atlasState.available || Date.now() - atlasState.checkedAt > ATLAS_PROBE_TTL;
}

const LEVELS = new Set(["highschool", "undergraduate", "postgraduate", "phd", "professional"]);
const STATUSES = new Set(["open", "upcoming", "closed", "rolling", "unknown"]);
const FUNDING = new Set(["full", "partial", "stipend", "none", "unknown"]);

function windowEnd(deadline?: string, now = new Date()) {
  const days = deadline === "week" ? 7 : deadline === "month" ? 31 : deadline === "quarter" ? 92 : null;
  return days === null ? null : new Date(now.getTime() + days * 86400000);
}

export function buildOpportunityFilter(input: OpportunitySearchInput, now = new Date()): Document {
  const filter: Document = { published: true };
  if (input.category) filter.category = input.category;
  if (input.featured) filter.featured = true;
  if (input.funding && FUNDING.has(input.funding)) filter["funding.type"] = input.funding;
  if (input.level && LEVELS.has(input.level)) {
    filter.$and = [
      ...(filter.$and ?? []),
      { $or: [{ "eligibility.levels": input.level }, { "eligibility.levels": { $exists: false } }, { "eligibility.levels": { $size: 0 } }] },
    ];
  }
  if (input.field) {
    filter["eligibility.fields"] = { $regex: `^${escapeRegExp(input.field)}$`, $options: "i" };
  }
  if (input.country) {
    const code = input.country.toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) {
      filter.$and = [
        ...(filter.$and ?? []),
        {
          $or: [
            { countries: { $in: [code, "Global"] } },
            { "eligibility.countries": code },
            { "eligibility.regions": { $in: [...regionsForCountry(code), "GLOBAL"] } },
          ],
        },
      ];
    }
  }

  const statusFilter = input.status && STATUSES.has(input.status) ? input.status : null;
  if (statusFilter) {
    filter.status = statusFilter;
  } else if (!input.showClosed) {
    filter.$and = [
      ...(filter.$and ?? []),
      {
        status: { $ne: "closed" },
        $or: [
          { "cycle.closesAt": { $gte: now } },
          { "cycle.closesAt": { $exists: false }, deadline: { $gte: now } },
          { "cycle.closesAt": { $exists: false }, deadline: null },
          { status: "rolling" },
          { status: "upcoming" },
        ],
      },
    ];
  }

  const end = windowEnd(input.deadline, now);
  if (end) {
    filter.$and = [
      ...(filter.$and ?? []),
      {
        $or: [
          { "cycle.closesAt": { $gte: now, $lte: end } },
          { "cycle.closesAt": { $exists: false }, deadline: { $gte: now, $lte: end } },
        ],
      },
    ];
  }

  if (input.closesFrom || input.closesTo) {
    const from = input.closesFrom ? new Date(input.closesFrom) : now;
    const to = input.closesTo ? new Date(input.closesTo) : new Date(now.getTime() + 365 * 86400000);
    filter.$and = [
      ...(filter.$and ?? []),
      {
        $or: [
          { "cycle.closesAt": { $gte: from, $lte: to } },
          { "cycle.closesAt": { $exists: false }, deadline: { $gte: from, $lte: to } },
        ],
      },
    ];
  }

  return filter;
}

function sortStages(now: Date, sort: OpportunitySearchInput["sort"] = "deadline"): Document[] {
  if (sort === "recent") return [{ $sort: { createdAt: -1 } }];
  return [
    {
      $addFields: {
        _sortDeadline: { $ifNull: ["$cycle.closesAt", "$deadline"] },
        _sortStatus: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "closed"] }, then: 3 },
              { case: { $gt: [{ $ifNull: ["$cycle.opensAt", null] }, now] }, then: 1 },
              { case: { $eq: ["$status", "upcoming"] }, then: 1 },
              { case: { $and: [{ $ne: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, { $lt: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, now] }] }, then: 3 },
              { case: { $in: ["$status", ["open", "rolling"]] }, then: 0 },
              { case: { $eq: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, then: 2 },
            ],
            default: 0,
          },
        },
      },
    },
    { $sort: { _sortStatus: 1, _sortDeadline: 1, createdAt: -1 } },
    { $project: { _sortDeadline: 0, _sortStatus: 0 } },
  ];
}

/** Atlas compound filter clauses built from the same facet input. */
function atlasFilter(input: OpportunitySearchInput, now: Date): Document[] {
  const clauses: Document[] = [{ equals: { path: "published", value: true } }];
  if (input.category) clauses.push({ equals: { path: "category", value: input.category } });
  if (input.featured) clauses.push({ equals: { path: "featured", value: true } });
  if (input.funding && FUNDING.has(input.funding)) clauses.push({ equals: { path: "funding.type", value: input.funding } });
  if (input.level && LEVELS.has(input.level)) clauses.push({ in: { path: "eligibility.levels", value: [input.level, ""] } });
  if (input.country && /^[A-Za-z]{2}$/.test(input.country)) {
    const code = input.country.toUpperCase();
    clauses.push({
      compound: {
        should: [
          { in: { path: "eligibility.countries", value: [code] } },
          { in: { path: "eligibility.regions", value: [...regionsForCountry(code), "GLOBAL"] } },
        ],
        minimumShouldMatch: 1,
      },
    });
  }
  const statusFilter = input.status && STATUSES.has(input.status) ? input.status : null;
  if (statusFilter) clauses.push({ equals: { path: "status", value: statusFilter } });
  // When showing open items only, closed records are removed by the $match
  // stage that follows $search (the compound DSL cannot express "not equal"
  // portably across Atlas tiers).

  const end = windowEnd(input.deadline, now);
  if (end) {
    clauses.push({ range: { path: "cycle.closesAt", gte: now, lte: end } });
  }
  return clauses;
}

function atlasSearchStage(q: string, input: OpportunitySearchInput, now: Date): Document {
  return {
    $search: {
      index: ATLAS_INDEX,
      compound: {
        must: [
          {
            text: {
              query: q,
              path: ["title", "description", "organisation", "tags", "eligibility.fields"],
              fuzzy: { maxEdits: 1, prefixLength: 2, maxExpansions: 20 },
            },
          },
        ],
        // The excluded (closed) case is applied after $search to keep the
        // compound query small and compatible with every Atlas tier.
        filter: atlasFilter(input, now),
      },
      highlight: { path: ["title"] },
    },
  };
}

async function atlasSearch(input: OpportunitySearchInput, q: string, now: Date): Promise<OpportunitySearchResult | null> {
  if (!atlasUsable()) return null;
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;
  try {
    const compound = atlasSearchStage(q, input, now);
    const pipeline: Document[] = [
      compound as Document,
      { $match: buildOpportunityFilter(input, now) },
      ...sortStages(now, input.sort),
      { $unset: "highlights" },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];
    const items = await col.aggregate<Opportunity>(pipeline).toArray();
    const meta = await col
      .aggregate<{ count: { total: number } }>([{ $searchMeta: { index: ATLAS_INDEX, compound: compound.$search.compound } }])
      .toArray();
    const total = meta[0]?.count?.total ?? (items.length + (page - 1) * pageSize);
    atlasState = { available: true, checkedAt: Date.now() };
    return { items, total, page, pageSize, engine: "atlas" };
  } catch (error) {
    console.warn("[search] Atlas Search unavailable, using fallback:", error instanceof Error ? error.message : error);
    markAtlasUnavailable();
    return null;
  }
}

async function textSearch(input: OpportunitySearchInput, q: string, now: Date): Promise<OpportunitySearchResult | null> {
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;
  const filter = { ...buildOpportunityFilter(input, now), $text: { $search: q } } as Document;
  try {
    const [items, total] = await Promise.all([
      col
        .aggregate<Opportunity>([
          { $match: filter },
          { $addFields: { score: { $meta: "textScore" } } },
          ...sortStages(now, input.sort),
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
        ])
        .toArray(),
      col.countDocuments(filter),
    ]);
    return { items, total, page, pageSize, engine: "text" };
  } catch {
    return null;
  }
}

async function regexSearch(input: OpportunitySearchInput, q: string, now: Date): Promise<OpportunitySearchResult> {
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;
  const pattern = escapeRegExp(q);
  const filter = {
    ...buildOpportunityFilter(input, now),
    $or: [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { organisation: { $regex: pattern, $options: "i" } },
      { tags: { $regex: pattern, $options: "i" } },
      { "eligibility.fields": { $regex: pattern, $options: "i" } },
    ],
  } as Document;
  const [items, total] = await Promise.all([
    col
      .aggregate<Opportunity>([{ $match: filter }, ...sortStages(now, input.sort), { $skip: (page - 1) * pageSize }, { $limit: pageSize }])
      .toArray(),
    col.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, engine: "regex" };
}

/**
 * Search opportunities with Atlas Search when available, then the Mongo text
 * index, then a bounded escaped regex. All three return the same pagination
 * metadata shape (BUG-8).
 */
export async function searchOpportunities(input: OpportunitySearchInput): Promise<OpportunitySearchResult> {
  const q = parseSearchText(input.q ?? "");
  const now = new Date();
  if (q) {
    const atlas = await atlasSearch(input, q, now);
    if (atlas) return atlas;
    const text = await textSearch(input, q, now);
    if (text) return text;
    return regexSearch(input, q, now);
  }

  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const filter = buildOpportunityFilter(input, now);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;
  const [items, total] = await Promise.all([
    col
      .aggregate<Opportunity>([{ $match: filter }, ...sortStages(now, input.sort), { $skip: (page - 1) * pageSize }, { $limit: pageSize }])
      .toArray(),
    col.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, engine: "mongo" };
}

/** Typeahead suggestions used by the search bar and Finder inputs. */
export async function suggestOpportunities(q: string, limit = 6): Promise<Array<{ title: string; slug: string; category: string }>> {
  const query = parseSearchText(q);
  if (query.length < 2) return [];
  const db = await getDb();
  const col = db.collection<Opportunity>(Collections.opportunities);
  const regex = { $regex: `^${escapeRegExp(query)}`, $options: "i" };
  const results = await col
    .find({ published: true, $or: [{ title: regex }, { organisation: regex }, { tags: regex }] }, { projection: { title: 1, slug: 1, category: 1 } })
    .limit(limit)
    .toArray();
  return results.map((item) => ({ title: item.title, slug: item.slug, category: item.category }));
}

export const SEARCH_LEVELS = [...LEVELS];
export const SEARCH_FUNDING = [...FUNDING];
