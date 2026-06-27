import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import type { Opportunity, ApiResponse } from "@/types";

interface Params {
  params: Promise<{ slug: string }>;
}

// ─── GET /api/opportunities/[slug] ────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const db = await getDb();
    const opportunity = await db
      .collection<Opportunity>(Collections.opportunities)
      .findOne({ slug, published: true });

    if (!opportunity) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Opportunity>>({
      success: true,
      data: opportunity,
    });
  } catch (err) {
    console.error("[GET /api/opportunities/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}
