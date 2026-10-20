import "server-only";
import { createHash } from "node:crypto";
import type { Db } from "mongodb";
import { getDb, Collections } from "@/lib/db";
import { recordEvent } from "@/lib/events";
import type { Opportunity, FinderResult, FinderPick } from "@/types";
import { filterCandidates, matchedCriteria, type FinderProfile } from "./filter";
import { rankCandidates, deterministicReason, type ScoredCandidate } from "./score";
import { buildPrompt, compactCandidate, SYSTEM_PROMPT } from "./prompt";
import { validatePicks } from "./validate";

export interface CompletionRequest {
  system: string;
  user: string;
  model: string;
}

export type Complete = (request: CompletionRequest) => Promise<string>;

export interface BuildOptions {
  now?: Date;
  complete?: Complete;
  /** Force AI off (used by tests and when no key is configured). */
  useAI?: boolean;
}

const CANDIDATES_SENT = 24;
const MAX_RESULTS = 6;

export function normalizeProfile(profile: FinderProfile): FinderProfile {
  return {
    country: profile.country.trim(),
    course: profile.course.trim(),
    level: profile.level,
    interests: [...new Set(profile.interests.map((interest) => interest.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    careerGoal: profile.careerGoal.trim(),
    has: [...new Set((profile.has ?? []).map((item) => item.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  };
}

export function profileHash(profile: FinderProfile): string {
  return createHash("sha256").update(JSON.stringify(normalizeProfile(profile))).digest("hex");
}

function toPick(candidate: ScoredCandidate, profile: FinderProfile, reason?: string): FinderPick {
  const opportunity = candidate.opportunity;
  return {
    slug: opportunity.slug,
    title: opportunity.title,
    category: opportunity.category,
    deadline: opportunity.cycle?.closesAt ?? opportunity.deadline ?? null,
    description: opportunity.description,
    funding: opportunity.funding,
    reason: (reason ?? deterministicReason(candidate, profile)).slice(0, 240),
    matchedCriteria: matchedCriteria(opportunity, profile),
    score: Math.round(candidate.score),
  };
}

function deterministicExplanation(considered: number, picks: FinderPick[]): string {
  if (!picks.length) {
    return "We could not find a confirmed match in the current catalogue. Broaden your field or check back as new opportunities are added.";
  }
  return `We filtered ${considered} candidate ${considered === 1 ? "opportunity" : "opportunities"} by country, level and field, then ranked them by relevance and deadline. Start with ${picks[0].title}; always confirm eligibility on the official page.`;
}

/**
 * Pure ranking + optional explanation. Exported so the evaluation harness can
 * run without a database or network.
 */
export async function buildFinderResult(profileInput: FinderProfile, opportunities: Opportunity[], options: BuildOptions = {}): Promise<FinderResult> {
  const profile = normalizeProfile(profileInput);
  const now = options.now ?? new Date();
  const candidates = filterCandidates(opportunities, profile, now);
  const ranked = rankCandidates(candidates, profile, CANDIDATES_SENT, now);

  if (!ranked.length) {
    return { picks: [], explanation: deterministicExplanation(0, []), considered: 0, ai: false };
  }

  const compact = ranked.map(compactCandidate);
  const allowed = new Set(compact.map((candidate) => candidate.id));
  const useAI = options.useAI !== false && Boolean(process.env.GROQ_API_KEY || options.complete);
  let note: string | undefined;

  if (useAI) {
    try {
      const raw = await completeWithGroq(profile, compact, options.complete);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const validated = validatePicks(parsed, allowed);
      if (validated && validated.picks.length) {
        const byId = new Map(ranked.map((candidate) => [candidate.opportunity.slug, candidate]));
        const picks = validated.picks
          .map((pick) => {
            const candidate = byId.get(pick.id);
            return candidate ? toPick(candidate, profile, pick.reason) : null;
          })
          .filter((pick): pick is FinderPick => Boolean(pick))
          .slice(0, MAX_RESULTS);
        if (picks.length) {
          return {
            picks,
            explanation: validated.explanation || deterministicExplanation(ranked.length, picks),
            considered: ranked.length,
            ai: true,
          };
        }
      }
      note = "AI explanations were unavailable for this run, so these are ranked by our deterministic score.";
    } catch (error) {
      console.warn("[finder] AI unavailable, using deterministic ranking:", error instanceof Error ? error.message : error);
      note = "AI explanations unavailable right now. These results come from our eligibility filter and relevance score.";
    }
  } else {
    note = "AI explanations are off; results are ranked by eligibility, relevance and deadline.";
  }

  const picks = ranked.slice(0, MAX_RESULTS).map((candidate) => toPick(candidate, profile));
  return {
    picks,
    explanation: deterministicExplanation(ranked.length, picks),
    considered: ranked.length,
    ai: false,
    note,
  };
}

async function completeWithGroq(profile: FinderProfile, candidates: ReturnType<typeof compactCandidate>[], complete?: Complete): Promise<string> {
  const model = process.env.GROQ_FINDER_MODEL ?? "llama-3.3-70b-versatile";
  const request = { system: SYSTEM_PROMPT, user: buildPrompt(profile, candidates), model };
  if (complete) return complete(request);
  const { default: Groq } = await import("groq-sdk");
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

/** Loads candidates, checks the short-lived cache and records anonymised demand. */
export async function runFinder(profile: FinderProfile, db?: Db): Promise<FinderResult> {
  const database = db ?? (await getDb());
  const hash = profileHash(profile);
  const cache = database.collection<{ _id: string; result: FinderResult; expiresAt: Date }>(Collections.finderCache);
  const cached = await cache.findOne({ _id: hash });
  if (cached && cached.expiresAt > new Date()) {
    return { ...cached.result, cached: true };
  }

  const now = new Date();
  const opportunities = await database
    .collection<Opportunity>(Collections.opportunities)
    .find(
      { published: true },
      { projection: { title: 1, slug: 1, description: 1, category: 1, countries: 1, deadline: 1, eligibility: 1, funding: 1, cycle: 1, status: 1, confidence: 1, verifiedAt: 1, tags: 1, organisation: 1 } }
    )
    .limit(600)
    .toArray();

  const result = await buildFinderResult(profile, opportunities, { now });
  await cache.updateOne(
    { _id: hash },
    { $set: { result, expiresAt: new Date(Date.now() + 30 * 60_000) } },
    { upsert: true }
  );
  await recordEvent({
    type: "finder_run",
    country: profile.country.slice(0, 60),
    level: profile.level,
    resultCount: result.picks.length,
    meta: { ai: result.ai, considered: result.considered },
  });
  return result;
}
