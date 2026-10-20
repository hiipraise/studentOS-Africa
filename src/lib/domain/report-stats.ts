import type { Benefit, Report, ReportOutcome } from "@/types";
import { COUNTRY_BY_CODE, mapCountryText } from "@/lib/domain/countries";

export const REPORT_WINDOW_MONTHS = 12;
export const MIN_REPORT_SAMPLE = 5;

export interface OutcomeCounts {
  worked: number;
  partial: number;
  failed: number;
  unknown: number;
  total: number;
}

export interface RateSummary {
  counts: OutcomeCounts;
  /** Share of decided reports where the student said it worked (0..1). */
  workedRate: number | null;
  /** Worked + half of partial, so a partly successful claim is not counted as failure. */
  weightedSuccessRate: number | null;
  /** False until the minimum sample is reached — the UI must not show a rate. */
  enoughData: boolean;
}

export interface CountryStats extends RateSummary {
  code: string;
  name: string;
}

export interface ReportStats {
  overall: RateSummary;
  byCountry: CountryStats[];
  recentTotal: number;
  allTimeTotal: number;
  windowMonths: number;
  minSample: number;
  latestReportAt: Date | null;
}

function decided(report: Report): ReportOutcome | "unknown" {
  const outcome = report.outcome;
  if (outcome === "worked" || outcome === "partial" || outcome === "failed") return outcome;
  return "unknown";
}

function emptyCounts(): OutcomeCounts {
  return { worked: 0, partial: 0, failed: 0, unknown: 0, total: 0 };
}

function summarise(counts: OutcomeCounts, minSample: number): RateSummary {
  const total = counts.total;
  const workedRate = total > 0 ? counts.worked / total : null;
  const weightedSuccessRate = total > 0 ? (counts.worked + counts.partial * 0.5) / total : null;
  return { counts, workedRate, weightedSuccessRate, enoughData: total >= minSample };
}

/** Approved reports only; callers must filter moderation before calling. */
export function computeReportStats(
  reports: Report[],
  options: { now?: Date; windowMonths?: number; minSample?: number } = {},
): ReportStats {
  const now = options.now ?? new Date();
  const windowMonths = options.windowMonths ?? REPORT_WINDOW_MONTHS;
  const minSample = options.minSample ?? MIN_REPORT_SAMPLE;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - windowMonths);

  const overallCounts = emptyCounts();
  const countryCounts = new Map<string, OutcomeCounts>();
  let recentTotal = 0;
  let latestReportAt: Date | null = null;

  for (const report of reports) {
    const date = report.reportDate ? new Date(report.reportDate) : new Date(report.createdAt);
    if (!latestReportAt || date > latestReportAt) latestReportAt = date;
    if (date < cutoff) continue;

    recentTotal += 1;
    const outcome = decided(report);
    overallCounts.total += 1;
    overallCounts[outcome] += 1;

    const code = report.countryCode ?? mapCountryText(report.country)?.codes[0] ?? null;
    if (!code || !COUNTRY_BY_CODE.has(code)) continue;
    const bucket = countryCounts.get(code) ?? emptyCounts();
    bucket.total += 1;
    bucket[outcome] += 1;
    countryCounts.set(code, bucket);
  }

  const byCountry: CountryStats[] = [...countryCounts.entries()]
    .map(([code, counts]) => ({ code, name: COUNTRY_BY_CODE.get(code) ?? code, ...summarise(counts, minSample) }))
    .sort((a, b) => b.counts.total - a.counts.total || a.name.localeCompare(b.name));

  return {
    overall: summarise(overallCounts, minSample),
    byCountry,
    recentTotal,
    allTimeTotal: reports.length,
    windowMonths,
    minSample,
    latestReportAt,
  };
}

export type AvailabilityState = "works" | "partial" | "blocked" | "unknown";

export interface AvailabilityEntry {
  code: string;
  name: string;
  state: AvailabilityState;
  reports: number;
  source: "reports" | "admin" | "none";
}

export interface AvailabilityView {
  entries: AvailabilityEntry[];
  notes?: string;
  updatedAt: Date | null;
  /** True when at least one country has a non-unknown state. */
  known: boolean;
}

function stateFromCounts(counts: OutcomeCounts): AvailabilityState {
  if (counts.total < 2) return "unknown";
  const weighted = (counts.worked + counts.partial * 0.5) / counts.total;
  if (weighted >= 0.6) return "works";
  if (weighted >= 0.25) return "partial";
  return "blocked";
}

/**
 * Merge editorial availability (verified by an admin) with recent report
 * evidence. Admin notes win because a human checked the provider's terms;
 * reports fill in countries the editor has not covered yet.
 */
export function computeAvailability(benefit: Pick<Benefit, "availability">, reports: Report[], now = new Date()): AvailabilityView {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - REPORT_WINDOW_MONTHS);

  const reportCounts = new Map<string, OutcomeCounts>();
  let latestReport: Date | null = null;
  for (const report of reports) {
    const date = report.reportDate ? new Date(report.reportDate) : new Date(report.createdAt);
    if (date < cutoff) continue;
    const code = report.countryCode ?? mapCountryText(report.country)?.codes[0] ?? null;
    if (!code) continue;
    const bucket = reportCounts.get(code) ?? emptyCounts();
    bucket.total += 1;
    bucket[decided(report)] += 1;
    reportCounts.set(code, bucket);
    if (!latestReport || date > latestReport) latestReport = date;
  }

  const adminRecord = benefit.availability?.countries ?? {};
  const codes = new Set<string>([...Object.keys(adminRecord), ...reportCounts.keys()]);
  const entries: AvailabilityEntry[] = [...codes].map((code) => {
    const adminState = adminRecord[code];
    const counts = reportCounts.get(code);
    const reportState = counts ? stateFromCounts(counts) : "unknown";
    const state: AvailabilityState = adminState && adminState !== "unknown" ? adminState : reportState;
    return {
      code,
      name: COUNTRY_BY_CODE.get(code) ?? code,
      state,
      reports: counts?.total ?? 0,
      source: adminState && adminState !== "unknown" ? "admin" : counts ? "reports" : "none",
    };
  });

  entries.sort((a, b) => {
    const rank: Record<AvailabilityState, number> = { works: 0, partial: 1, blocked: 2, unknown: 3 };
    return rank[a.state] - rank[b.state] || a.name.localeCompare(b.name);
  });

  const adminUpdated = benefit.availability?.updatedAt ? new Date(benefit.availability.updatedAt) : null;
  const updatedAt = [adminUpdated, latestReport].filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    entries,
    notes: benefit.availability?.notes,
    updatedAt,
    known: entries.some((entry) => entry.state !== "unknown"),
  };
}

/** Public list: hide contact details and moderation notes from students. */
export function publicReport(report: Report) {
  return {
    _id: report._id?.toString(),
    benefitId: report.benefitId,
    benefitTitle: report.benefitTitle,
    school: report.school,
    country: report.country,
    countryCode: report.countryCode,
    outcome: decided(report),
    verificationMethod: report.verificationMethod,
    timeToApproveDays: report.timeToApproveDays,
    paymentIssue: report.paymentIssue ? { occurred: report.paymentIssue.occurred, notes: report.paymentIssue.notes } : undefined,
    reportDate: report.reportDate,
    comment: report.comment,
    createdAt: report.createdAt,
  };
}

export type PublicReport = ReturnType<typeof publicReport>;
