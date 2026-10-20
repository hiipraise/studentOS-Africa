import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { isPublicHttpUrl } from "@/lib/safe-url";
import { recordEvent } from "@/lib/events";

/**
 * Logged outbound redirect. Only resolves a known slug, never a client URL,
 * and validates the destination before redirecting (no open redirect).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const safeSlug = slug.slice(0, 220);
  const db = await getDb();
  const record =
    (await db.collection(Collections.opportunities).findOne({ slug: safeSlug }, { projection: { officialLink: 1, title: 1 } })) ??
    (await db.collection(Collections.benefits).findOne({ slug: safeSlug }, { projection: { officialLink: 1, title: 1 } })) ??
    (await db.collection(Collections.tools).findOne({ slug: safeSlug }, { projection: { officialLink: 1, title: 1 } }));

  const destination = (record as { officialLink?: string } | null)?.officialLink;
  if (!isPublicHttpUrl(destination)) {
    return NextResponse.redirect(new URL("/opportunities", request.url));
  }

  const referrer = request.nextUrl.searchParams.get("from")?.slice(0, 60);
  await recordEvent({ type: "outbound_click", slug: safeSlug, page: referrer ?? "unknown" });
  return NextResponse.redirect(destination, { status: 307, headers: { "Referrer-Policy": "strict-origin-when-cross-origin" } });
}
