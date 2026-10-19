import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { CreateBenefitSchema } from "@/lib/schemas/benefit";
import { requireAdminApi } from "@/lib/api-auth";
import type { Benefit, ApiResponse } from "@/types";
import { parsePage, parsePageSize } from "@/lib/safe-query";

// ─── GET /api/benefits ────────────────────────────────────────────────────
// Query params: ?featured=true  ?page=1  ?pageSize=12

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const featured = searchParams.get("featured");
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { published: true };
    if (featured === "true") filter.featured = true;

    const db = await getDb();
    const col = db.collection<Benefit>(Collections.benefits);

    const [items, total] = await Promise.all([
      col
        .find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<Benefit[]>>({
      success: true,
      data: items,
      meta: { total, page, pageSize },
    });
  } catch (err) {
    console.error("[GET /api/benefits]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch benefits" },
      { status: 500 }
    );
  }
}

// ─── POST /api/benefits (Admin only) ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreateBenefitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const now = new Date();
    const doc: Benefit = { ...parsed.data, createdAt: now, updatedAt: now };

    const db = await getDb();
    const result = await db
      .collection<Benefit>(Collections.benefits)
      .insertOne(doc);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/benefits]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to create benefit" },
      { status: 500 }
    );
  }
}
