import { describe, expect, it } from "vitest";
import { contentChanged, scraperOwnedSet } from "../scripts/scrapers/lib/upsert-policy";

describe("scraper editorial protection", () => {
  it("does not unpublish, unfeature, replace verified state, or overwrite admin-edited fields on reruns", () => {
    const existing = { published: true, featured: true, verifiedAt: new Date("2026-01-01"), title: "Admin corrected title", description: "Admin's original summary", editedByAdmin: ["title", "description"] };
    const proposed = { published: false, featured: false, verifiedAt: null, title: "Scraped title", description: "Copied source text", sourceHash: "new", lastSeenAt: new Date() };
    const update = scraperOwnedSet(existing, proposed);
    expect(update).not.toHaveProperty("published");
    expect(update).not.toHaveProperty("featured");
    expect(update).not.toHaveProperty("verifiedAt");
    expect(update).not.toHaveProperty("title");
    expect(update).not.toHaveProperty("description");
    expect(update.sourceHash).toBe("new");
  });

  it("detects an upstream hash change without changing the live record", () => {
    expect(contentChanged("previous", "current")).toBe(true);
    expect(contentChanged("same", "same")).toBe(false);
    expect(contentChanged(undefined, "first-observation")).toBe(false);
  });
});
