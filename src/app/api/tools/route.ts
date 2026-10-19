import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { CreateToolSchema } from "@/lib/schemas/tool";
import type { Tool, ApiResponse } from "@/types";
import { parsePage, parsePageSize } from "@/lib/safe-query";

// ─── GET /api/tools ───────────────────────────────────────────────────────
// Query params: ?category=AI  ?featured=true  ?free=true  ?page=1  ?pageSize=12

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const free = searchParams.get("free");
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { published: true };
    if (category) filter.category = category;
    if (featured === "true") filter.featured = true;
    if (free === "true") filter.free = true;

    const db = await getDb();
    const col = db.collection<Tool>(Collections.tools);

    const [items, total] = await Promise.all([
      col
        .find(filter)
        .sort({ featured: -1, category: 1, title: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<Tool[]>>({
      success: true,
      data: items,
      meta: { total, page, pageSize },
    });
  } catch (err) {
    console.error("[GET /api/tools]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

// ─── POST /api/tools (Admin only) ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreateToolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const now = new Date();
    const doc: Tool = {
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db
      .collection<Tool>(Collections.tools)
      .insertOne(doc);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/tools]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to create tool" },
      { status: 500 }
    );
  }
}
