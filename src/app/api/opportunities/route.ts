import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { CreateOpportunitySchema } from "@/lib/schemas/opportunity";
import type { Opportunity, ApiResponse } from "@/types";

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
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10))
    );

    const db = await getDb();
    const col = db.collection<Opportunity>(Collections.opportunities);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { published: true };

    if (category) filter.category = category;
    if (country) filter.countries = country; // array contains
    if (featured === "true") filter.featured = true;

    // Full-text search via Atlas Search index named "opportunities_search"
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
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
        ];
        const results = await col.aggregate<Opportunity>(pipeline).toArray();
        return NextResponse.json<ApiResponse<Opportunity[]>>({
          success: true,
          data: results,
        });
      } catch {
        // Atlas Search not available — fallback
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ];
      }
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
    const doc: Opportunity = {
      ...parsed.data,
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
