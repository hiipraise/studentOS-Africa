import { getNewThisWeek } from "@/lib/data/opportunities";

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "https://studentos.africa").replace(/\/$/, "");

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export const revalidate = 900;

export async function GET() {
  let items: Awaited<ReturnType<typeof getNewThisWeek>> = [];
  try {
    items = await getNewThisWeek(50);
  } catch {
    items = [];
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>StudentOS Africa — new opportunities</title>
<link>${BASE}/</link>
<description>New scholarships, fellowships, internships and grants for African students.</description>
<language>en</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.map((item) => `<item>
<title>${escapeXml(item.title)}</title>
<link>${BASE}/opportunities/${escapeXml(item.slug)}</link>
<guid isPermaLink="true">${BASE}/opportunities/${escapeXml(item.slug)}</guid>
<description>${escapeXml(item.description.slice(0, 300))}</description>
<pubDate>${new Date(item.firstSeenAt ?? item.createdAt).toUTCString()}</pubDate>
</item>`).join("")}
</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } });
}
