import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { CreateOpportunitySchema } from "@/lib/schemas/opportunity";
import { requireAdminApi } from "@/lib/api-auth";
import type { Opportunity, ApiResponse } from "@/types";
import { parseBool, parsePage, parsePageSize, parseSearchText, safeRegex } from "@/lib/safe-query";
import { mapCountryText, regionsForCountry } from "@/lib/domain/countries";
import { deriveStatus } from "@/lib/domain/status";

// ─── GET /api/opportunities ────────────────────────────────────────────────
// Query params:
//   ?category=Scholarship
//   ?country=NG
//   ?featured=true
//   ?page=1&pageSize=12
//   ?q=search+term   (full-text via Atlas Search)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const featured = searchParams.get("featured");
    const q = parseSearchText(searchParams.get("q"));
    const showClosed = parseBool(searchParams.get("showClosed"));
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"));
    const now = new Date();
    const sortStages: import("mongodb").Document[] = [
      { $addFields: { _sortDeadline: { $ifNull: ["$cycle.closesAt", "$deadline"] }, _sortStatus: { $switch: { branches: [
        { case: { $eq: ["$status", "closed"] }, then: 3 },
        { case: { $gt: [{ $ifNull: ["$cycle.opensAt", null] }, now] }, then: 1 },
        { case: { $and: [{ $ne: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, { $lt: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, now] }] }, then: 3 },
        { case: { $eq: ["$status", "upcoming"] }, then: 1 },
        { case: { $in: ["$status", ["open", "rolling"]] }, then: 0 },
        { case: { $eq: [{ $ifNull: ["$cycle.closesAt", "$deadline"] }, null] }, then: 2 },
      ], default: 0 } } } },
      { $sort: { _sortStatus: 1, _sortDeadline: 1, createdAt: -1 } },
      { $project: { _sortDeadline: 0, _sortStatus: 0 } },
    ];

    const db = await getDb();
    const col = db.collection<Opportunity>(Collections.opportunities);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { published: true };

    if (category) filter.category = category;
    if (country) filter.$and = [{ $or: [{ countries: country.toUpperCase() }, { "eligibility.countries": country.toUpperCase() }, { "eligibility.regions": { $in: [...regionsForCountry(country), "GLOBAL"] } }] }];
    if (!showClosed) (filter.$and ??= []).push({ status: { $ne: "closed" }, $or: [
      { "cycle.closesAt": { $gte: now } },
      { "cycle.closesAt": { $exists: false }, deadline: { $gte: now } },
      { "cycle.closesAt": { $exists: false }, deadline: null },
      { status: "rolling" },
      { status: "upcoming", "cycle.opensAt": { $gt: now } },
    ] });
    if (featured === "true") filter.featured = true;

    // Escaped bounded regex fallback keeps the country/status constraints consistent.
    // Falls back to regex if Atlas Search not configured
      if (q) {
      try {
        const pipeline = [
          {
            $search: {
              index: "opportunities_search",
              text: { query: q, path: ["title", "description"] },
            },
          },
          { $match: filter },
          ...sortStages,
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
        ];
        const results = await col.aggregate<Opportunity>(pipeline).toArray();
        const total = await col.countDocuments(filter);
        return NextResponse.json<ApiResponse<Opportunity[]>>({
          success: true,
          data: results,
          meta: { total, page, pageSize },
        });
      } catch {
        // Atlas Search not available — fallback
        filter.$or = [
          { title: { $regex: safeRegex(q), $options: "i" } },
          { description: { $regex: safeRegex(q), $options: "i" } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      col.aggregate<Opportunity>([{ $match: filter }, ...sortStages, { $skip: (page - 1) * pageSize }, { $limit: pageSize }]).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<Opportunity[]>>({
      success: true,
      data: items,
      meta: { total, page, pageSize },
    });
  } catch (err) {
    console.error("[GET /api/opportunities]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

// ─── POST /api/opportunities (Admin only) ──────────────────────────────────

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreateOpportunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const now = new Date();
    const mapped = parsed.data.countries.map(mapCountryText);
    const doc: Opportunity = {
      ...parsed.data,
      eligibility: parsed.data.eligibility ?? {
        countries: [...new Set(mapped.flatMap((entry) => entry?.codes ?? []))],
        regions: [...new Set(mapped.flatMap((entry) => entry?.regions ?? []))], levels: [], fields: [],
        ...(mapped.some((entry) => entry === null) ? { notes: "Some legacy eligibility text needs review." } : {}),
      },
      funding: parsed.data.funding ?? { type: "unknown" },
      cycle: parsed.data.cycle ?? { closesAt: parsed.data.deadline ?? undefined },
      status: parsed.data.status ?? deriveStatus({ ...parsed.data.cycle, deadline: parsed.data.deadline }),
      source: parsed.data.source ?? { type: "admin", url: parsed.data.officialLink },
      confidence: parsed.data.confidence ?? "low",
      needsReview: parsed.data.needsReview ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db
      .collection<Opportunity>(Collections.opportunities)
      .insertOne(doc);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/opportunities]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
