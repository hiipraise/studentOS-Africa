import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { CreateGuideSchema } from "@/lib/schemas/guide";
import type { Guide, ApiResponse } from "@/types";
import { parsePage, parsePageSize } from "@/lib/safe-query";

// ─── GET /api/guides ──────────────────────────────────────────────────────
// Query params: ?tag=scholarship  ?featured=true  ?page=1  ?pageSize=10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured");
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"), 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { published: true };
    if (tag) filter.tags = tag;
    if (featured === "true") filter.featured = true;

    const db = await getDb();
    const col = db.collection<Guide>(Collections.guides);

    // Return only listing fields — exclude full content for performance
    const projection = {
      title: 1,
      slug: 1,
      excerpt: 1,
      tags: 1,
      image: 1,
      readingTimeMinutes: 1,
      featured: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      col
        .find(filter, { projection })
        .sort({ featured: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<Partial<Guide>[]>>({
      success: true,
      data: items,
      meta: { total, page, pageSize },
    });
  } catch (err) {
    console.error("[GET /api/guides]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch guides" },
      { status: 500 }
    );
  }
}

// ─── POST /api/guides (Admin only) ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreateGuideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const now = new Date();
    const doc: Guide = {
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db
      .collection<Guide>(Collections.guides)
      .insertOne(doc);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/guides]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to create guide" },
      { status: 500 }
    );
  }
}
