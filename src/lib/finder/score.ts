import type { Opportunity } from "@/types";
import { profileKeywords, type Candidate, type FinderProfile } from "./filter";

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "have", "want", "your", "into", "about", "their", "would", "like", "study", "studies", "student", "students", "become"]);

export interface ScoredCandidate extends Candidate {
  score: number;
  scoreBreakdown: {
    relevance: number;
    deadline: number;
    funding: number;
    confidence: number;
    category: number;
    penalty: number;
  };
}

function tokenize(value: string) {
  return new Set(value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9+#.]+/).filter((word) => word.length >= 3 && !STOP.has(word)));
}

function overlap(a: Set<string>, b: Set<string>) {
  let hits = 0;
  for (const word of a) if (b.has(word)) hits++;
  return hits;
}

function daysUntil(date: Date | null | undefined, now: Date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - now.getTime()) / 86400000);
}

/**
 * Deterministic relevance score. The AI only ranks this list later; with the
 * model disabled this produces a sensible, explainable result set.
 */
export function scoreCandidate(candidate: Candidate, profile: FinderProfile, now = new Date()): ScoredCandidate {
  const opportunity = candidate.opportunity as Opportunity & { tags?: string[]; organisation?: string };
  const keywords = new Set(profileKeywords(profile));
  const haystack = tokenize(
    [opportunity.title, opportunity.description, opportunity.organisation ?? "", ...(opportunity.tags ?? []), ...(opportunity.eligibility?.fields ?? [])].join(" ")
  );
  const relevanceHits = overlap(keywords, haystack);
  const relevance = Math.min(40, relevanceHits * 8 + (candidate.eligibilityVerdict === "eligible" ? 8 : 0));

  const closes = daysUntil(opportunity.cycle?.closesAt ?? opportunity.deadline, now);
  let deadline = 8;
  if (closes !== null) {
    if (closes < 0) deadline = 0;
    else if (closes <= 7) deadline = 20;
    else if (closes <= 30) deadline = 16;
    else if (closes <= 90) deadline = 12;
    else deadline = 6;
  }

  const funding = opportunity.funding?.type === "full" ? 10 : opportunity.funding?.type === "partial" ? 7 : opportunity.funding?.type === "stipend" ? 5 : 2;

  const ageDays = opportunity.verifiedAt ? (now.getTime() - new Date(opportunity.verifiedAt).getTime()) / 86400000 : null;
  const confidence = opportunity.confidence === "high" ? 8 : opportunity.confidence === "medium" ? 5 : 1;
  const freshness = ageDays === null ? 0 : ageDays <= 45 ? 3 : ageDays <= 120 ? 1 : 0;

  const categorySignals: Record<string, string[]> = {
    Scholarship: ["scholarship", "funding", "tuition", "study", "academic", "research"],
    Internship: ["internship", "job", "work", "engineer", "developer", "placement"],
    Fellowship: ["fellowship", "leadership", "network", "mentor"],
    Competition: ["competition", "challenge", "prize", "contest"],
    Hackathon: ["hackathon", "build", "prototype", "coding"],
    Grant: ["grant", "funding", "project", "research"],
    Program: ["program", "programme", "training", "cohort", "bootcamp"],
  };
  const category = (categorySignals[opportunity.category] ?? []).some((word) => keywords.has(word)) ? 6 : 0;
  const penalty = candidate.eligibilityVerdict === "check" ? -6 : 0;

  return {
    ...candidate,
    score: Math.max(0, relevance + deadline + funding + confidence + freshness + category + penalty),
    scoreBreakdown: { relevance, deadline, funding, confidence: confidence + freshness, category, penalty },
  };
}

export function rankCandidates(candidates: Candidate[], profile: FinderProfile, limit = 30, now = new Date()): ScoredCandidate[] {
  return candidates
    .map((candidate) => scoreCandidate(candidate, profile, now))
    .sort((a, b) => b.score - a.score || a.opportunity.slug.localeCompare(b.opportunity.slug))
    .slice(0, limit);
}

/** Human-readable reason used when the LLM is unavailable. */
export function deterministicReason(candidate: ScoredCandidate, profile: FinderProfile): string {
  const parts: string[] = [];
  if (candidate.eligibilityVerdict === "eligible") parts.push(`Matches your ${profile.level} level`);
  else parts.push("Worth checking — eligibility details are incomplete");
  if (candidate.opportunity.funding?.type === "full") parts.push("fully funded");
  const closes = candidate.opportunity.cycle?.closesAt ?? candidate.opportunity.deadline;
  if (closes) {
    const days = Math.max(0, Math.ceil((new Date(closes).getTime() - Date.now()) / 86400000));
    parts.push(days <= 14 ? `closes in ${days} day${days === 1 ? "" : "s"}` : "an upcoming deadline");
  }
  const keywords = profileKeywords(profile);
  const haystack = `${candidate.opportunity.title} ${candidate.opportunity.description}`.toLowerCase();
  const hit = keywords.find((word) => haystack.includes(word));
  if (hit) parts.push(`connected to ${hit}`);
  return parts.join(", ").replace(/^./, (character) => character.toUpperCase()) + ".";
}
