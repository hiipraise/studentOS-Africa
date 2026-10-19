import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { CreateReportSchema, ModerateReportSchema } from "@/lib/schemas/report";
import { ObjectId } from "mongodb";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Report, ApiResponse } from "@/types";
import { parsePage, parsePageSize, safeRegex } from "@/lib/safe-query";

// ─── GET /api/reports ─────────────────────────────────────────────────────
// Query params: ?benefitId=xxx  ?country=NG  ?page=1  ?pageSize=10
// Only returns approved reports for public consumers

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const benefitId = searchParams.get("benefitId");
    const country = searchParams.get("country");
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"), 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { status: "approved" };
    if (benefitId) filter.benefitId = benefitId;
    if (country) filter.country = { $regex: safeRegex(country), $options: "i" };

    const db = await getDb();
    const col = db.collection<Report>(Collections.reports);

    const [items, total] = await Promise.all([
      col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<Report[]>>({
      success: true,
      data: items,
      meta: { total, page, pageSize },
    });
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/reports (Admin only) — moderate a report ─────────────────

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, ...moderation } = body;

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report ID is required" },
        { status: 400 }
      );
    }

    const parsed = ModerateReportSchema.safeParse(moderation);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Report>(Collections.reports)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...parsed.data } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ moderated: boolean }>>({
      success: true,
      data: { moderated: true },
    });
  } catch (err) {
    console.error("[PATCH /api/reports]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to moderate report" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/reports (Admin only) — delete a report ───────────────────

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection<Report>(Collections.reports)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (err) {
    console.error("[DELETE /api/reports]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to delete report" },
      { status: 500 }
    );
  }
}

// ─── POST /api/reports (Public) ───────────────────────────────────────────
// Submitted reports start as "pending" until admin moderates

export async function POST(req: NextRequest) {
  const limit = await enforceRateLimit(req, "reports", 5, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json<ApiResponse<never>>({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  try {
    const body = await req.json();
    const parsed = CreateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const doc: Report = {
      ...parsed.data,
      // Always start as pending regardless of what client sends
      status: "pending",
      createdAt: new Date(),
    };

    const db = await getDb();
    const result = await db
      .collection<Report>(Collections.reports)
      .insertOne(doc);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
