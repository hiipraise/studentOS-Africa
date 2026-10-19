import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getDb, Collections } from "@/lib/db";
import { FinderInputSchema } from "@/lib/schemas/finder";
import type {
  Opportunity,
  Benefit,
  Tool,
  Guide,
  FinderResult,
  ApiResponse,
} from "@/types";
import { enforceRateLimit } from "@/lib/rate-limit";
import { mapCountryText, regionsForCountry } from "@/lib/domain/countries";

// ─── POST /api/finder ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) return NextResponse.json<ApiResponse<never>>({ success: false, error: "AI is unavailable right now. Please try again later." }, { status: 503 });
    const minute = await enforceRateLimit(req, "finder", 5, 60_000);
    const day = await enforceRateLimit(req, "finder", 30, 86_400_000, "daily");
    if (!minute.allowed || !day.allowed) {
      const retryAfter = Math.max(minute.allowed ? 0 : minute.retryAfter, day.allowed ? 0 : day.retryAfter);
      return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const body = await req.json();
    const parsed = FinderInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { country, course, level, interests, careerGoal } = parsed.data;
    const countryMapping = mapCountryText(country);
    const eligibleCountryCodes = countryMapping?.codes.length ? countryMapping.codes : /^[A-Za-z]{2}$/.test(country) ? [country.toUpperCase()] : [];
    const eligibilityMatch = eligibleCountryCodes.length ? { $or: [
      { countries: { $in: [country, ...eligibleCountryCodes] } },
      { "eligibility.countries": { $in: eligibleCountryCodes } },
      { "eligibility.regions": { $in: [...new Set(eligibleCountryCodes.flatMap(regionsForCountry)), "GLOBAL"] } },
    ] } : { countries: country };
    const now = new Date();

    // ── 1. Pull candidate data from DB ──────────────────────────────────
    const db = await getDb();

    const [opportunities, benefits, tools, guides] = await Promise.all([
      db
        .collection<Opportunity>(Collections.opportunities)
        .find({ published: true, status: { $ne: "closed" }, $and: [
          eligibilityMatch,
          { $or: [{ "cycle.closesAt": { $gte: now } }, { "cycle.closesAt": { $exists: false }, deadline: { $gte: now } }, { "cycle.closesAt": { $exists: false }, deadline: null }, { status: "rolling" }, { status: "upcoming", "cycle.opensAt": { $gt: now } }] },
          { $or: [{ "eligibility.levels": level }, { "eligibility.levels": { $exists: false } }, { "eligibility.levels": { $size: 0 } }] },
        ] })
        .project({
          title: 1,
          slug: 1,
          category: 1,
          description: 1,
          countries: 1,
          deadline: 1,
          requirements: 1,
          eligibility: 1,
          cycle: 1,
          status: 1,
        })
        .limit(100)
        .toArray(),

      db
        .collection<Benefit>(Collections.benefits)
        .find({ published: true })
        .project({ title: 1, slug: 1, description: 1, eligibility: 1 })
        .limit(50)
        .toArray(),

      db
        .collection<Tool>(Collections.tools)
        .find({ published: true })
        .project({ title: 1, slug: 1, category: 1, description: 1 })
        .limit(50)
        .toArray(),

      db
        .collection<Guide>(Collections.guides)
        .find({ published: true })
        .project({ title: 1, slug: 1, excerpt: 1, tags: 1 })
        .limit(50)
        .toArray(),
    ]);

    // ── 2. Ask Groq to rank and select ───────────────────────────────────
    const systemPrompt = `You are the StudentOS AI Finder — an expert advisor for African students.
Your job: given a student profile and a catalogue of opportunities, benefits, tools, and guides,
select the best matches and return ONLY a JSON object with this exact shape:

{
  "opportunities": [{ "slug": string, "reason": string }],  // max 5
  "benefits":      [{ "slug": string, "reason": string }],  // max 4
  "tools":         [{ "slug": string, "reason": string }],  // max 4
  "guides":        [{ "slug": string, "reason": string }],  // max 3
  "explanation":   string  // 2-3 sentences summary for the student
}

Return ONLY valid JSON. No markdown. No preamble.`;

    const userMessage = `STUDENT PROFILE:
Country: ${country}
Course: ${course}
Level: ${level}
Interests: ${interests.join(", ")}
Career goal: ${careerGoal}

OPPORTUNITIES CATALOGUE:
${JSON.stringify(opportunities, null, 0)}

BENEFITS CATALOGUE:
${JSON.stringify(benefits, null, 0)}

TOOLS CATALOGUE:
${JSON.stringify(tools, null, 0)}

GUIDES CATALOGUE:
${JSON.stringify(guides, null, 0)}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const aiPicks = JSON.parse(raw) as {
      opportunities: { slug: string; reason: string }[];
      benefits: { slug: string; reason: string }[];
      tools: { slug: string; reason: string }[];
      guides: { slug: string; reason: string }[];
      explanation: string;
    };

    // ── 3. Hydrate slugs back to full objects ────────────────────────────
    const toSlugSet = (arr: { slug: string }[]) =>
      new Set(arr.map((x) => x.slug));

    const oppSlugs = toSlugSet(aiPicks.opportunities ?? []);
    const benSlugs = toSlugSet(aiPicks.benefits ?? []);
    const toolSlugs = toSlugSet(aiPicks.tools ?? []);
    const guideSlugs = toSlugSet(aiPicks.guides ?? []);

    const result: FinderResult = {
      opportunities: (opportunities as Opportunity[])
        .filter((o) => oppSlugs.has(o.slug))
        .map(({ title, slug, category, deadline, description }) => ({
          title,
          slug,
          category,
          deadline,
          description,
        })),

      benefits: (benefits as Benefit[])
        .filter((b) => benSlugs.has(b.slug))
        .map(({ title, slug, description }) => ({ title, slug, description })),

      tools: (tools as Tool[])
        .filter((t) => toolSlugs.has(t.slug))
        .map(({ title, slug, category, description }) => ({
          title,
          slug,
          category,
          description,
        })),

      guides: (guides as Guide[])
        .filter((g) => guideSlugs.has(g.slug))
        .map(({ title, slug, excerpt }) => ({ title, slug, excerpt })),

      explanation: aiPicks.explanation ?? "",
    };

    return NextResponse.json<ApiResponse<FinderResult>>({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[POST /api/finder]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "AI Finder failed. Please try again." },
      { status: 500 }
    );
  }
}
