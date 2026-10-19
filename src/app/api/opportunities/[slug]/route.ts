import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { UpdateOpportunitySchema } from "@/lib/schemas/opportunity";
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

// ─── PATCH /api/opportunities/[slug] (Admin only) ─────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = UpdateOpportunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Opportunity>(Collections.opportunities)
      .updateOne({ slug }, { $set: { ...parsed.data, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  } catch (err) {
    console.error("[PATCH /api/opportunities/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/opportunities/[slug] (Admin only) ────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;

    const db = await getDb();
    const result = await db
      .collection<Opportunity>(Collections.opportunities)
      .deleteOne({ slug });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/opportunities/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
