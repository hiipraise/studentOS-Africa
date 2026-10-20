import type { Opportunity } from "@/types";
import { mapCountryText, regionsForCountry } from "@/lib/domain/countries";
import { getOpportunityStatus } from "@/lib/domain/status";

export interface FinderProfile {
  country: string;
  course: string;
  level: "highschool" | "undergraduate" | "postgraduate" | "phd" | "professional";
  interests: string[];
  careerGoal: string;
  has?: string[];
}

export type EligibilityVerdict = "eligible" | "check" | "ineligible";

export interface Candidate {
  opportunity: Opportunity;
  eligibilityVerdict: EligibilityVerdict;
  eligibilityNote?: string;
}

function normalized(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "have", "want", "your", "into", "about", "their", "would", "like", "study", "studies", "student", "students"]);

export function profileKeywords(profile: FinderProfile): string[] {
  const text = [profile.course, ...(profile.interests ?? []), profile.careerGoal].join(" ");
  return [...new Set(normalized(text).split(/[^a-z0-9+#.]+/).filter((word) => word.length >= 3 && !STOP.has(word)))].slice(0, 30);
}

function isOpen(opportunity: Opportunity, now: Date) {
  const status = getOpportunityStatus(opportunity, now);
  return status === "open" || status === "upcoming" || status === "rolling";
}

/**
 * Deterministic eligibility pre-filter (S5.1). Closed items never pass.
 * Missing eligibility data is kept and marked "check", never silently
 * included as if it were eligible.
 */
export function filterCandidates(opportunities: Opportunity[], profile: FinderProfile, now = new Date()): Candidate[] {
  const mapping = mapCountryText(profile.country);
  const codes = mapping?.codes.length ? mapping.codes : /^[A-Za-z]{2}$/.test(profile.country.trim()) ? [profile.country.trim().toUpperCase()] : [];
  const regions = new Set(["GLOBAL", ...codes.flatMap((code) => regionsForCountry(code))]);
  const courseWords = normalized(profile.course).split(/\s+/).filter((word) => word.length >= 3);

  const result: Candidate[] = [];
  for (const opportunity of opportunities) {
    if (!opportunity.published) continue;
    if (!isOpen(opportunity, now)) continue;

    const eligibility = opportunity.eligibility;
    if (!eligibility) {
      result.push({ opportunity, eligibilityVerdict: "check", eligibilityNote: "Eligibility is not structured yet — check the official page." });
      continue;
    }

    const countryCodes = eligibility.countries ?? [];
    const eligibilityRegions = eligibility.regions ?? [];
    const countryKnown = countryCodes.length > 0 || eligibilityRegions.length > 0;
    const countryMatches =
      (codes.length > 0 && countryCodes.some((code) => codes.includes(code))) ||
      eligibilityRegions.some((region) => regions.has(region));
    if (countryKnown && codes.length > 0 && !countryMatches) continue;

    const levels = eligibility.levels ?? [];
    if (levels.length > 0 && !levels.includes(profile.level)) continue;

    const fields = (eligibility.fields ?? []).map(normalized);
    if (fields.length > 0) {
      const fieldMatch = fields.some((field) => courseWords.some((word) => field.includes(word) || word.includes(field)));
      if (!fieldMatch) continue;
    }

    if (!countryKnown || levels.length === 0 || fields.length === 0) {
      result.push({
        opportunity,
        eligibilityVerdict: "check",
        eligibilityNote: !countryKnown
          ? "Country eligibility is not recorded — check the official page."
          : levels.length === 0
            ? "Study level is not recorded — check eligibility."
            : "Field of study is not recorded — check eligibility.",
      });
    } else {
      result.push({ opportunity, eligibilityVerdict: "eligible" });
    }
  }
  return result;
}

export function matchedCriteria(opportunity: Opportunity, profile: FinderProfile): string[] {
  const criteria: string[] = [];
  const mapping = mapCountryText(profile.country);
  const codes = mapping?.codes ?? [];
  const regions = new Set(["GLOBAL", ...codes.flatMap((code) => regionsForCountry(code))]);
  const eligibility = opportunity.eligibility;
  if (!eligibility) return ["Check eligibility on the official page"];
  if (eligibility.countries?.some((code) => codes.includes(code)) || eligibility.regions?.some((region) => regions.has(region))) {
    criteria.push(`Open to ${profile.country}`);
  } else if (eligibility.countries?.length || eligibility.regions?.length) {
    criteria.push("Check your country eligibility");
  }
  if (eligibility.levels?.includes(profile.level)) criteria.push(`${profile.level[0].toUpperCase()}${profile.level.slice(1)} level`);
  if (eligibility.fields?.length) criteria.push(`Relevant to ${profile.course}`);
  const closesAt = opportunity.cycle?.closesAt ?? opportunity.deadline;
  if (closesAt) {
    criteria.push(`Closes ${new Date(closesAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`);
  }
  if (opportunity.funding?.type === "full") criteria.push("Fully funded");
  else if (opportunity.funding?.type === "partial") criteria.push("Partial funding");
  return criteria.slice(0, 5);
}

export { isOpen };
