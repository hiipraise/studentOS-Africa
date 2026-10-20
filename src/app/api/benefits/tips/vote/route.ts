import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, Collections } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolvePublishedBenefit } from "@/lib/reports";
import { logError } from "@/lib/logger";
import type { ApiResponse, Benefit } from "@/types";

export const runtime = "nodejs";

/** One helpful vote per IP per tip per day. No account required. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { benefitId?: unknown; index?: unknown } | null;
    const benefitId = typeof body?.benefitId === "string" ? body.benefitId : "";
    const index = Number(body?.index);

    if (!benefitId || !Number.isInteger(index) || index < 0 || index > 50) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid tip" }, { status: 400 });
    }

    const limit = await enforceRateLimit(req, "tip-vote", 1, 86_400_000, `${benefitId}:${index}`);
    if (!limit.allowed) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "You already found this helpful today." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    }

    const benefit = await resolvePublishedBenefit(benefitId);
    if (!benefit) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Benefit not found" }, { status: 404 });
    }
    if (!Array.isArray(benefit.tips) || !benefit.tips[index] || benefit.tips[index].published === false) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Tip not found" }, { status: 404 });
    }

    const db = await getDb();
    await db
      .collection<Benefit>(Collections.benefits)
      .updateOne({ _id: benefit._id as ObjectId }, { $inc: { [`tips.${index}.helpful`]: 1 } });

    return NextResponse.json<ApiResponse<{ ok: boolean }>>({ success: true, data: { ok: true } });
  } catch (error) {
    logError("tip vote failed", error, { route: "/api/benefits/tips/vote" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Could not record your vote" }, { status: 500 });
  }
}
