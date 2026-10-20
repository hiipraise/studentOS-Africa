import { NextRequest, NextResponse } from "next/server";
import { FinderInputSchema } from "@/lib/schemas/finder";
import type { ApiResponse, FinderResult } from "@/types";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runFinder } from "@/lib/finder/run";
import { getDb, Collections } from "@/lib/db";
import { appUrl, signToken } from "@/lib/tokens";
import { recordEvent } from "@/lib/events";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

// ─── POST /api/finder ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const minute = await enforceRateLimit(req, "finder", 5, 60_000);
    const day = await enforceRateLimit(req, "finder", 30, 86_400_000, "daily");
    if (!minute.allowed || !day.allowed) {
      const retryAfter = Math.max(minute.allowed ? 0 : minute.retryAfter, day.allowed ? 0 : day.retryAfter);
      return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }

    const body = await req.json().catch(() => null);
    const parsed = FinderInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await runFinder(parsed.data);
    const shareId = crypto.randomUUID();
    const token = signToken({ shareId, purpose: "finder-share" }, 60 * 60 * 24 * 7);
    const db = await getDb();
    await db.collection<{ _id: string; result: FinderResult; createdAt: Date; expiresAt: Date }>(Collections.finderShares).insertOne({
      _id: shareId,
      result,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    return NextResponse.json<ApiResponse<FinderResult>>({
      success: true,
      data: { ...result, shareUrl: appUrl(`/finder/share/${token}`) },
    });
  } catch (error) {
    logError("finder run failed", error, { route: "/api/finder", requestId });
    // Run never 500s because the model failed; this catches infrastructure errors.
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Finder is temporarily unavailable. Browse opportunities instead." }, { status: 503 });
  }
}

// ─── GET /api/finder?share=token — read a shared result ──────────────────

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("share");
    const { verifyToken } = await import("@/lib/tokens");
    const payload = verifyToken<{ shareId: string; purpose: string }>(token);
    if (!payload || payload.purpose !== "finder-share") {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "That shared result is invalid or has expired." }, { status: 404 });
    }
    const db = await getDb();
    const row = await db.collection<{ _id: string; result: FinderResult; expiresAt: Date }>(Collections.finderShares).findOne({ _id: payload.shareId });
    if (!row || row.expiresAt < new Date()) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "That shared result has expired." }, { status: 404 });
    }
    await recordEvent({ type: "page_view", page: "finder-share", resultCount: row.result.picks.length });
    return NextResponse.json<ApiResponse<FinderResult>>({ success: true, data: row.result });
  } catch (error) {
    logError("finder share read failed", error, { route: "/api/finder" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Shared result unavailable." }, { status: 500 });
  }
}
