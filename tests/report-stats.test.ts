import { describe, expect, it } from "vitest";
import { computeAvailability, computeReportStats, MIN_REPORT_SAMPLE } from "@/lib/domain/report-stats";
import type { Report } from "@/types";

const now = new Date("2026-10-20T12:00:00.000Z");

function report(overrides: Partial<Report> = {}): Report {
  return {
    benefitId: "benefit-1",
    benefitTitle: "GitHub Student Pack",
    school: "University of Lagos",
    country: "Nigeria",
    countryCode: "NG",
    outcome: "worked",
    moderation: "approved",
    comment: "The process worked and took a few days.",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("report statistics", () => {
  it("withholds a rate below the minimum sample", () => {
    const stats = computeReportStats(Array.from({ length: MIN_REPORT_SAMPLE - 1 }, () => report()), { now });
    expect(stats.overall.enoughData).toBe(false);
    expect(stats.overall.workedRate).toBeCloseTo(1);
  });

  it("shows a rate at the minimum sample and counts each outcome", () => {
    const reports = [report(), report(), report(), report(), report({ outcome: "failed", school: "University of Ghana", countryCode: "GH", country: "Ghana" })];
    const stats = computeReportStats(reports, { now });
    expect(stats.overall.enoughData).toBe(true);
    expect(stats.overall.counts).toMatchObject({ worked: 4, failed: 1, total: 5 });
    expect(stats.overall.workedRate).toBeCloseTo(0.8);
    expect(stats.overall.weightedSuccessRate).toBeCloseTo(0.8);
    expect(stats.byCountry.find((row) => row.code === "NG")?.enoughData).toBe(false);
    expect(stats.byCountry.find((row) => row.code === "GH")?.enoughData).toBe(false);
  });

  it("requires the minimum sample within a country before showing a country rate", () => {
    const reports = Array.from({ length: MIN_REPORT_SAMPLE }, () => report({ countryCode: "NG", country: "Nigeria" }));
    const stats = computeReportStats(reports, { now });
    expect(stats.byCountry.find((row) => row.code === "NG")?.enoughData).toBe(true);
  });

  it("ignores reports older than the window for the headline rate", () => {
    const old = Array.from({ length: 6 }, () => report({ createdAt: new Date("2024-01-01T00:00:00.000Z"), outcome: "failed" }));
    const stats = computeReportStats([...old, report()], { now });
    expect(stats.recentTotal).toBe(1);
    expect(stats.allTimeTotal).toBe(7);
    expect(stats.overall.counts.total).toBe(1);
  });

  it("keeps legacy reports with no outcome out of the worked rate", () => {
    const stats = computeReportStats([report({ outcome: "unknown" }), report({ outcome: undefined }), ...Array.from({ length: 3 }, () => report())], { now });
    expect(stats.overall.counts.unknown).toBe(2);
    expect(stats.overall.workedRate).toBeCloseTo(3 / 5);
  });
});

describe("availability matrix", () => {
  it("prefers an admin-checked state over community evidence", () => {
    const view = computeAvailability(
      { availability: { countries: { NG: "blocked" } } },
      [report({ outcome: "worked", countryCode: "NG" }), report({ outcome: "worked", countryCode: "NG" })],
      now,
    );
    expect(view.entries.find((entry) => entry.code === "NG")).toMatchObject({ state: "blocked", source: "admin" });
  });

  it("derives a state from at least two recent reports", () => {
    const view = computeAvailability(
      { availability: { countries: {} } },
      [report({ countryCode: "KE", country: "Kenya", outcome: "worked" }), report({ countryCode: "KE", country: "Kenya", outcome: "partial" })],
      now,
    );
    expect(view.entries.find((entry) => entry.code === "KE")).toMatchObject({ state: "works", source: "reports", reports: 2 });
    expect(view.known).toBe(true);
  });

  it("does not guess from a single report", () => {
    const view = computeAvailability({ availability: { countries: {} } }, [report({ countryCode: "UG", country: "Uganda" })], now);
    expect(view.entries.find((entry) => entry.code === "UG")?.state).toBe("unknown");
    expect(view.known).toBe(false);
  });
});
