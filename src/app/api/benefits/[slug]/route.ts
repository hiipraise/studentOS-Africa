import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { UpdateBenefitSchema } from "@/lib/schemas/benefit";
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

// ─── PATCH /api/benefits/[slug] (Admin only) ──────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = UpdateBenefitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Benefit>(Collections.benefits)
      .updateOne({ slug }, { $set: { ...parsed.data, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Benefit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  } catch (err) {
    console.error("[PATCH /api/benefits/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to update benefit" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/benefits/[slug] (Admin only) ─────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;

    const db = await getDb();
    const result = await db
      .collection<Benefit>(Collections.benefits)
      .deleteOne({ slug });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Benefit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/benefits/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to delete benefit" },
      { status: 500 }
    );
  }
}
