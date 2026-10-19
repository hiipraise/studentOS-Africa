import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { UpdateToolSchema } from "@/lib/schemas/tool";
import type { Tool, ApiResponse } from "@/types";

interface Params {
  params: Promise<{ slug: string }>;
}

// ─── GET /api/tools/[slug] ────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const db = await getDb();
    const tool = await db
      .collection<Tool>(Collections.tools)
      .findOne({ slug, published: true });

    if (!tool) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Tool>>({
      success: true,
      data: tool,
    });
  } catch (err) {
    console.error("[GET /api/tools/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch tool" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/tools/[slug] (Admin only) ─────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = UpdateToolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Tool>(Collections.tools)
      .updateOne({ slug }, { $set: { ...parsed.data, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  } catch (err) {
    console.error("[PATCH /api/tools/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to update tool" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tools/[slug] (Admin only) ────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { slug } = await params;

    const db = await getDb();
    const result = await db
      .collection<Tool>(Collections.tools)
      .deleteOne({ slug });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Tool not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/tools/[slug]]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
