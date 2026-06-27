import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import type { Guide, ApiResponse } from "@/types";

interface Params {
  params: Promise<{ slug: string }>;
}

// ─── GET /api/guides/[slug] ───────────────────────────────────────────────
// Returns full guide including content (Markdown)

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const db = await getDb();
    const guide = await db
      .collection<Guide>(Collections.guides)
      .findOne({ slug, published: true });

    if (!guide) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Guide>>({
      success: true,
      data: guide,
    });
  } catch (err) {
    console.error("[GET /api/guides/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch guide" },
      { status: 500 }
    );
  }
}
