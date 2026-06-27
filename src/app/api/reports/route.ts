import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { CreateReportSchema } from "@/lib/schemas/report";
import type { Report, ApiResponse } from "@/types";

// ─── GET /api/reports ─────────────────────────────────────────────────────
// Query params: ?benefitId=xxx  ?country=NG  ?page=1  ?pageSize=10
// Only returns approved reports for public consumers

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const benefitId = searchParams.get("benefitId");
    const country = searchParams.get("country");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10))
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { status: "approved" };
    if (benefitId) filter.benefitId = benefitId;
    if (country) filter.country = { $regex: country, $options: "i" };

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

// ─── POST /api/reports (Public) ───────────────────────────────────────────
// Submitted reports start as "pending" until admin moderates

export async function POST(req: NextRequest) {
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
