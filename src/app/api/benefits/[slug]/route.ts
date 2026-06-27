import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import type { Benefit, Report, ApiResponse } from "@/types";

interface Params {
  params: Promise<{ slug: string }>;
}

// ─── GET /api/benefits/[slug] ─────────────────────────────────────────────
// Returns the benefit + its approved community reports in one shot

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const db = await getDb();

    const benefit = await db
      .collection<Benefit>(Collections.benefits)
      .findOne({ slug, published: true });

    if (!benefit) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Benefit not found" },
        { status: 404 }
      );
    }

    // Fetch approved reports for this benefit
    const reports = await db
      .collection<Report>(Collections.reports)
      .find({
        benefitId: benefit._id?.toString(),
        status: "approved",
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json<ApiResponse<{ benefit: Benefit; reports: Report[] }>>({
      success: true,
      data: { benefit, reports },
    });
  } catch (err) {
    console.error("[GET /api/benefits/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch benefit" },
      { status: 500 }
    );
  }
}
