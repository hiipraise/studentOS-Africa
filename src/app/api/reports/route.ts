import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, Collections } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { CreateReportSchema, ModerateReportSchema } from "@/lib/schemas/report";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Report, ApiResponse } from "@/types";
import { parsePage, parsePageSize } from "@/lib/safe-query";
import { recordEvent } from "@/lib/events";
import { logError } from "@/lib/logger";
import { mapCountryText } from "@/lib/domain/countries";
import {
  APPROVED_REPORT_FILTER,
  cleanComment,
  findRecentDuplicate,
  hashComment,
  resolvePublishedBenefit,
  submissionTimingValid,
  verifyTurnstile,
} from "@/lib/reports";
import { sendEmail } from "@/lib/email/adapter";
import { moderationEmail } from "@/lib/email/templates";
import { appUrl } from "@/lib/tokens";

export const runtime = "nodejs";

// ─── GET /api/reports ─────────────────────────────────────────────────────
// Public: approved reports only. Contact details are never returned.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const benefitId = searchParams.get("benefitId");
    const country = searchParams.get("country");
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"), 10);

    const filter: Record<string, unknown> = { ...APPROVED_REPORT_FILTER };
    if (benefitId) filter.benefitId = benefitId.slice(0, 120);
    if (country) {
      const raw = country.slice(0, 60);
      const mapping = mapCountryText(raw);
      filter.$and = [{ $or: [{ countryCode: mapping?.codes[0] }, { country: raw }] }];
    }

    const db = await getDb();
    const col = db.collection<Report>(Collections.reports);

    const [items, total] = await Promise.all([
      col.find(filter).sort({ reportDate: -1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map((report) => ({
        _id: report._id?.toString(),
        benefitId: report.benefitId,
        benefitTitle: report.benefitTitle,
        school: report.school,
        country: report.country,
        countryCode: report.countryCode,
        outcome: report.outcome ?? "unknown",
        verificationMethod: report.verificationMethod,
        timeToApproveDays: report.timeToApproveDays,
        paymentIssue: report.paymentIssue?.occurred ?? null,
        reportDate: report.reportDate,
        comment: report.comment,
        createdAt: report.createdAt,
      })),
      meta: { total, page, pageSize },
    });
  } catch (error) {
    logError("GET /api/reports failed", error, { route: "/api/reports" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}

// ─── PATCH /api/reports (Admin only) ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, ...moderation } = body ?? {};
    if (!id || !ObjectId.isValid(String(id))) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "A valid report id is required" }, { status: 400 });
    }

    const parsed = ModerateReportSchema.safeParse(moderation);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<Report>(Collections.reports);
    const before = await col.findOne({ _id: new ObjectId(String(id)) });
    if (!before) return NextResponse.json<ApiResponse<never>>({ success: false, error: "Report not found" }, { status: 404 });

    await col.updateOne(
      { _id: before._id },
      {
        $set: {
          moderation: parsed.data.moderation,
          ...(parsed.data.outcome ? { outcome: parsed.data.outcome } : {}),
          ...(parsed.data.moderationReason ? { moderationReason: parsed.data.moderationReason, adminNote: parsed.data.moderationReason } : {}),
          moderatedAt: new Date(),
        },
      },
    );

    const email = before.submitterEmail;
    if (email) {
      const template = moderationEmail(before.benefitTitle, parsed.data.moderation === "approved", parsed.data.moderationReason ?? "");
      const result = await sendEmail({ to: email, ...template, unsubscribeUrl: appUrl(`/newsletter/preferences?email=${encodeURIComponent(email)}`) });
      if (!result.success) console.warn("[reports] moderation email not sent:", result.error);
    }

    return NextResponse.json<ApiResponse<{ moderated: boolean }>>({ success: true, data: { moderated: true } });
  } catch (error) {
    logError("PATCH /api/reports failed", error, { route: "/api/reports" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to moderate report" }, { status: 500 });
  }
}

// ─── DELETE /api/reports (Admin only) ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "A valid report id is required" }, { status: 400 });
    }
    const db = await getDb();
    const result = await db.collection<Report>(Collections.reports).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({ success: true, data: { deleted: true } });
  } catch (error) {
    logError("DELETE /api/reports failed", error, { route: "/api/reports" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to delete report" }, { status: 500 });
  }
}

// ─── POST /api/reports (Public) ───────────────────────────────────────────
// Anti-spam: rate limit, honeypot, time-to-submit, Turnstile (when configured),
// duplicate text detection and link stripping. Every report starts pending.

export async function POST(req: NextRequest) {
  const limit = await enforceRateLimit(req, "reports", 5, 60 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Too many reports from this connection. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    // Honeypot: pretend success so bots do not learn how they were caught.
    const honeypot = (body as { website?: unknown }).website;
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: "pending" } }, { status: 202 });
    }

    const parsed = CreateReportSchema.safeParse(body);
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

    const benefit = await resolvePublishedBenefit(parsed.data.benefitId);
    if (!benefit) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Choose a published benefit from the list." }, { status: 400 });
    }

    const comment = cleanComment(parsed.data.comment);
    if (comment.length < 10) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "Please describe your experience in at least 10 characters (links are removed)." }, { status: 400 });
    }

    const commentHash = hashComment(comment);
    if (await findRecentDuplicate(benefit._id?.toString() ?? benefit.slug, commentHash)) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "We already have this report. Thank you — it is in the moderation queue." }, { status: 409 });
    }

    const countryCode = mapCountryText(parsed.data.country)?.codes[0];
    const now = new Date();
    const doc: Report = {
      benefitId: benefit._id?.toString() ?? benefit.slug,
      benefitTitle: benefit.title,
      school: parsed.data.school,
      country: parsed.data.country,
      countryCode,
      outcome: parsed.data.outcome,
      moderation: "pending",
      verificationMethod: parsed.data.verificationMethod,
      timeToApproveDays: parsed.data.timeToApproveDays ?? null,
      paymentIssue: parsed.data.paymentIssue,
      reportDate: parsed.data.reportDate ?? now,
      comment,
      commentHash,
      submitterEmail: parsed.data.submitterEmail,
      createdAt: now,
    };

    const db = await getDb();
    const result = await db.collection<Report>(Collections.reports).insertOne(doc);
    await recordEvent({ type: "report_submitted", slug: benefit.slug, country: countryCode, category: parsed.data.outcome });

    return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: result.insertedId.toString() } }, { status: 201 });
  } catch (error) {
    logError("POST /api/reports failed", error, { route: "/api/reports" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to submit report" }, { status: 500 });
  }
}
