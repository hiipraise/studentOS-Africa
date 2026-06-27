import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import type { Tool, ApiResponse } from "@/types";

// ─── GET /api/tools ───────────────────────────────────────────────────────
// Query params: ?category=AI  ?featured=true  ?free=true  ?page=1  ?pageSize=12

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const free = searchParams.get("free");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10))
    );

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
