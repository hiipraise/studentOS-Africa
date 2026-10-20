import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import { z } from "zod";
import type { SavedItem, ApiResponse } from "@/types";
import { recordEvent } from "@/lib/events";
import { logError } from "@/lib/logger";

const SaveSchema = z.object({
  slug: z.string().min(1).max(220).optional(),
  title: z.string().max(220).optional(),
  deadline: z.string().datetime().nullable().optional(),
  items: z.array(z.object({ slug: z.string().min(1).max(220), title: z.string().max(220), deadline: z.string().nullable().optional() })).max(30).optional(),
  stage: z.enum(["saved", "preparing", "submitted", "result"]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json<ApiResponse<never>>({ success: false, error: "unauthorized" }, { status: 401 });
  const db = await getDb();
  const items = await db.collection<SavedItem>(Collections.savedItems).find({ userEmail: email }).sort({ updatedAt: -1 }).toArray();
  return NextResponse.json<ApiResponse<SavedItem[]>>({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json<ApiResponse<never>>({ success: false, error: "unauthorized" }, { status: 401 });
  try {
    const parsed = SaveSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const db = await getDb();
    const col = db.collection<SavedItem>(Collections.savedItems);
    const now = new Date();
    const items = parsed.data.items ?? (parsed.data.slug ? [{ slug: parsed.data.slug, title: parsed.data.title ?? parsed.data.slug, deadline: parsed.data.deadline }] : []);
    if (!items.length) return NextResponse.json<ApiResponse<never>>({ success: false, error: "No items supplied" }, { status: 400 });

    for (const item of items) {
      await col.updateOne(
        { userEmail: email, opportunitySlug: item.slug },
        {
          $set: { opportunityTitle: item.title, deadline: item.deadline ? new Date(item.deadline) : null, updatedAt: now },
          $setOnInsert: { userEmail: email, opportunitySlug: item.slug, stage: "saved", createdAt: now },
        },
        { upsert: true }
      );
    }
    await recordEvent({ type: "save", slug: items[0]?.slug, meta: { count: items.length } });
    return NextResponse.json<ApiResponse<{ saved: number }>>({ success: true, data: { saved: items.length } });
  } catch (error) {
    logError("save failed", error, { route: "/api/saved" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Could not save" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json<ApiResponse<never>>({ success: false, error: "unauthorized" }, { status: 401 });
  const parsed = SaveSchema.extend({ slug: z.string().min(1).max(220) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  const db = await getDb();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.stage) update.stage = parsed.data.stage;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  const result = await db.collection<SavedItem>(Collections.savedItems).updateOne({ userEmail: email, opportunitySlug: parsed.data.slug }, { $set: update });
  return NextResponse.json({ success: true, data: { updated: result.matchedCount } });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json<ApiResponse<never>>({ success: false, error: "unauthorized" }, { status: 401 });
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json<ApiResponse<never>>({ success: false, error: "slug is required" }, { status: 400 });
  const db = await getDb();
  await db.collection<SavedItem>(Collections.savedItems).deleteOne({ userEmail: email, opportunitySlug: slug });
  return NextResponse.json({ success: true, data: { deleted: true } });
}
