import { z } from "zod";

export const FinderPicksSchema = z.object({
  picks: z
    .array(
      z.object({
        id: z.string().min(1).max(220),
        reason: z.string().min(1).max(240),
      })
    )
    .max(6)
    .default([]),
  explanation: z.string().max(600).default(""),
});

export type FinderPicks = z.infer<typeof FinderPicksSchema>;

/**
 * Validates model output and drops anything the model invented. Returns only
 * picks whose id exists in the candidate set, de-duplicated and capped.
 */
export function validatePicks(raw: unknown, allowedIds: Set<string>) {
  const parsed = FinderPicksSchema.safeParse(raw);
  if (!parsed.success) return null;
  const seen = new Set<string>();
  const picks = parsed.data.picks
    .filter((pick) => allowedIds.has(pick.id) && !seen.has(pick.id))
    .map((pick) => {
      seen.add(pick.id);
      return { id: pick.id, reason: pick.reason.trim().slice(0, 240) };
    })
    .slice(0, 6);
  return { picks, explanation: parsed.data.explanation.trim().slice(0, 600) };
}
