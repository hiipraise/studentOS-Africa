import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { CreateSuggestionSchema } from "@/lib/schemas/suggestion";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cleanComment, submissionTimingValid, verifyTurnstile } from "@/lib/reports";
import { logError } from "@/lib/logger";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";

/**
 * Public suggestion form. Feeds the same admin review queue as scraped drafts
 * and student "report outdated" flags; nothing is published automatically.
 */
export async function POST(req: NextRequest) {
  const limit = await enforceRateLimit(req, "suggestions", 5, 60 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Too many suggestions from this connection. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const honeypot = (body as { website?: unknown }).website;
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: "pending" } }, { status: 202 });
    }

    const parsed = CreateSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }
    if (!submissionTimingValid(parsed.data.startedAt)) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "That was too fast — please take a moment and submit again." }, { status: 400 });
    }

    const ip = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Verification failed. Refresh the page and try again." }, { status: 400 });
    }

    const details = cleanComment(parsed.data.details);
    const now = new Date();
    const slug = `${parsed.data.kind}-${now.getTime().toString(36)}`;
    const payload = {
      title: parsed.data.title,
      url: parsed.data.url || undefined,
      country: parsed.data.country,
      details,
      submitterEmail: parsed.data.submitterEmail,
    };

    const db = await getDb();
    await db.collection(Collections.suggestions).insertOne({
      kind: parsed.data.kind,
      status: "pending",
      slug,
      payload,
      createdAt: now,
    });
    await db.collection(Collections.reviewQueue).insertOne({
      entityType: "suggestion",
      status: "pending",
      source: "community",
      targetSlug: null,
      payload,
      live: null,
      slug,
      createdAt: now,
    });

    return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: slug } }, { status: 201 });
  } catch (error) {
    logError("POST /api/suggestions failed", error, { route: "/api/suggestions" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Could not save your suggestion" }, { status: 500 });
  }
}
