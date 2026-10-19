import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, Collections } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { CreateOpportunitySchema } from "@/lib/schemas/opportunity";
import { CreateBenefitSchema } from "@/lib/schemas/benefit";
import { CreateToolSchema } from "@/lib/schemas/tool";
import { CreateGuideSchema } from "@/lib/schemas/guide";

const input = z.object({ entityType: z.enum(["opportunities", "benefits", "tools", "guides"]), payload: z.unknown(), targetSlug: z.string().optional(), submitter: z.string().email().optional() });
const validators = { opportunities: CreateOpportunitySchema, benefits: CreateBenefitSchema, tools: CreateToolSchema, guides: CreateGuideSchema };
export async function POST(request: NextRequest) {
  const limit = await enforceRateLimit(request, "suggestions", 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many suggestions" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid suggestion" }, { status: 400 });
  const payload = validators[parsed.data.entityType].safeParse(parsed.data.payload);
  if (!payload.success) return NextResponse.json({ success: false, error: "Suggestion does not match the listing schema", details: payload.error.flatten() }, { status: 400 });
  const db = await getDb();
  const live = parsed.data.targetSlug ? await db.collection(parsed.data.entityType).findOne({ slug: parsed.data.targetSlug }) : null;
  const result = await db.collection(Collections.reviewQueue).insertOne({ entityType: parsed.data.entityType, targetSlug: parsed.data.targetSlug, payload: payload.data, live, submitter: parsed.data.submitter, status: "pending", createdAt: new Date() });
  return NextResponse.json({ success: true, data: { id: result.insertedId.toString() } }, { status: 201 });
}
