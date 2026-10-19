import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { UpdateGuideSchema } from "@/lib/schemas/guide";
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

// ─── PATCH /api/guides/[slug] (Admin only) ────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = UpdateGuideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Guide>(Collections.guides)
      .updateOne({ slug }, { $set: { ...parsed.data, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  } catch (err) {
    console.error("[PATCH /api/guides/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to update guide" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/guides/[slug] (Admin only) ───────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;

    const db = await getDb();
    const result = await db
      .collection<Guide>(Collections.guides)
      .deleteOne({ slug });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/guides/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to delete guide" },
      { status: 500 }
    );
  }
}
