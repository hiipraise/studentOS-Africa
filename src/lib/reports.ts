import "server-only";
import { createHash } from "node:crypto";
import { ObjectId, type Filter } from "mongodb";
import { getDb, Collections } from "@/lib/db";
import type { Benefit, Report } from "@/types";
import { getEnv } from "@/lib/env";

/** Remove links and repeated whitespace from community comments. */
export function cleanComment(input: string): string {
  return input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

export function hashComment(input: string): string {
  const normalised = input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
  return createHash("sha256").update(normalised).digest("hex");
}

/** Approved rows, including legacy rows where only `status` exists. */
export const APPROVED_REPORT_FILTER: Filter<Report> = {
  $or: [{ moderation: "approved" }, { moderation: { $exists: false }, status: "approved" }],
};

export const PENDING_REPORT_FILTER: Filter<Report> = {
  $or: [{ moderation: "pending" }, { moderation: { $exists: false }, status: "pending" }],
};

/**
 * Resolve the benefit on the server. Never trust the client's title snapshot.
 * Accepts a MongoDB id or (for older links) a slug.
 */
export async function resolvePublishedBenefit(idOrSlug: string): Promise<Benefit | null> {
  const db = await getDb();
  const col = db.collection<Benefit>(Collections.benefits);
  const query = ObjectId.isValid(idOrSlug)
    ? { $or: [{ _id: new ObjectId(idOrSlug) }, { slug: idOrSlug }], published: true }
    : { slug: idOrSlug, published: true };
  return col.findOne(query);
}

/**
 * Optional Cloudflare Turnstile check. When TURNSTILE_SECRET is not set the
 * check is skipped so local development and the free tier keep working.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = getEnv().TURNSTILE_SECRET;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    // A Turnstile outage must not make reporting impossible.
    console.warn("[reports] Turnstile verification unavailable; accepting the submission for manual moderation.");
    return true;
  }
}

/** Reject obvious bot timing without penalising slow connections. */
export function submissionTimingValid(startedAt: number | undefined, now = Date.now()): boolean {
  if (!startedAt) return true;
  const elapsed = now - startedAt;
  return elapsed >= 2500 && elapsed <= 1000 * 60 * 60 * 24;
}

export async function findRecentDuplicate(benefitId: string, commentHash: string): Promise<boolean> {
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 86400000);
  const existing = await db.collection<Report>(Collections.reports).findOne({
    benefitId,
    commentHash,
    createdAt: { $gte: since },
  });
  return Boolean(existing);
}

export async function listApprovedReportsForBenefit(benefit: Benefit, limit = 50): Promise<Report[]> {
  const db = await getDb();
  const ids = [benefit._id?.toString(), benefit.slug].filter((value): value is string => Boolean(value));
  return db
    .collection<Report>(Collections.reports)
    .find({ ...APPROVED_REPORT_FILTER, benefitId: { $in: ids } })
    .sort({ reportDate: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
}
