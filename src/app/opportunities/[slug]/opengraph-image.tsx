import { ImageResponse } from "next/og";
import { getOpportunityBySlug } from "@/lib/data/opportunities";

export const runtime = "nodejs";
export const alt = "StudentOS Africa opportunity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpportunityImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug).catch(() => null);
  const title = opportunity?.title ?? "Opportunity on StudentOS Africa";
  const category = opportunity?.category ?? "Opportunities";
  const closes = opportunity?.cycle?.closesAt ?? opportunity?.deadline;

  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0E5C2F", color: "#ffffff", padding: "64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ffffff", color: "#0E5C2F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>S</div>
          StudentOS Africa
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 26, color: "#E8C547" }}>{category}</div>
          <div style={{ fontSize: 66, lineHeight: 1.1, fontWeight: 700, maxHeight: 260, overflow: "hidden" }}>{title.slice(0, 110)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.8 }}>
          <span>{closes ? `Closes ${new Date(closes).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "Rolling applications"}</span>
          <span>studentos.africa</span>
        </div>
      </div>
    ),
    size
  );
}
