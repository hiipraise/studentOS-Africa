import { describe, expect, it } from "vitest";
import { filterCandidates, matchedCriteria, type FinderProfile } from "@/lib/finder/filter";
import { rankCandidates, deterministicReason } from "@/lib/finder/score";
import type { Opportunity } from "@/types";

const now = new Date("2026-10-20T12:00:00.000Z");
const profile: FinderProfile = {
  country: "Nigeria",
  course: "Computer Science",
  level: "postgraduate",
  interests: ["software engineering", "AI"],
  careerGoal: "Become a machine learning engineer",
};

function opportunity(overrides: Partial<Opportunity>): Opportunity {
  return {
    title: "Example scholarship",
    slug: "example",
    description: "A scholarship for African postgraduate students in technology.",
    category: "Scholarship",
    tags: ["technology"],
    countries: ["NG"],
    deadline: new Date("2026-11-01T00:00:00.000Z"),
    published: true,
    featured: false,
    requirements: [],
    benefits: [],
    applicationSteps: [],
    officialLink: "https://example.org",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    ...overrides,
  };
}

const eligible = opportunity({
  slug: "eligible",
  title: "AI scholarship for Nigerian postgraduates",
  eligibility: { countries: ["NG"], regions: [], levels: ["postgraduate"], fields: ["computer science"] },
  funding: { type: "full" },
  confidence: "high",
  verifiedAt: new Date("2026-10-10T00:00:00.000Z"),
});
const ineligibleCountry = opportunity({
  slug: "kenya-only",
  eligibility: { countries: ["KE"], regions: [], levels: ["postgraduate"], fields: ["computer science"] },
});
const closed = opportunity({ slug: "closed", deadline: new Date("2026-09-01T00:00:00.000Z") });
const unknownEligibility = opportunity({ slug: "unknown", title: "Technology grant", eligibility: undefined });

describe("finder deterministic filtering", () => {
  it("never includes closed or clearly ineligible items", () => {
    const candidates = filterCandidates([eligible, ineligibleCountry, closed, unknownEligibility], profile, now);
    const slugs = candidates.map((candidate) => candidate.opportunity.slug);
    expect(slugs).toContain("eligible");
    expect(slugs).not.toContain("kenya-only");
    expect(slugs).not.toContain("closed");
  });

  it("marks missing eligibility as check instead of silently excluding it", () => {
    const candidates = filterCandidates([unknownEligibility], profile, now);
    expect(candidates[0].eligibilityVerdict).toBe("check");
  });

  it("ranks an eligible, fully funded, soon-closing item first", () => {
    const ranked = rankCandidates(filterCandidates([unknownEligibility, eligible], profile, now), profile, 10, now);
    expect(ranked[0].opportunity.slug).toBe("eligible");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].eligibilityVerdict).toBe("eligible");
  });

  it("is deterministic for the same inputs", () => {
    const first = rankCandidates(filterCandidates([eligible, unknownEligibility], profile, now), profile, 10, now);
    const second = rankCandidates(filterCandidates([eligible, unknownEligibility], profile, now), profile, 10, now);
    expect(first.map((row) => [row.opportunity.slug, row.score])).toEqual(second.map((row) => [row.opportunity.slug, row.score]));
  });

  it("explains why an item matched without inventing eligibility", () => {
    const ranked = rankCandidates(filterCandidates([eligible], profile, now), profile, 10, now)[0];
    const criteria = matchedCriteria(eligible, profile);
    expect(criteria).toContain("Open to Nigeria");
    expect(criteria).toContain("Fully funded");
    expect(deterministicReason(ranked, profile)).toMatch(/Matches your postgraduate level/);
  });
});
