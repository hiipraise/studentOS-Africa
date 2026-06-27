import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import type { Guide, ApiResponse } from "@/types";

// ─── GET /api/guides ──────────────────────────────────────────────────────
// Query params: ?tag=scholarship  ?featured=true  ?page=1  ?pageSize=10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10))
    );

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
