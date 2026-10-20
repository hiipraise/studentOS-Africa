import { z } from "zod";
import { COUNTRY_BY_CODE } from "@/lib/domain/countries";

export const OpportunityCategoryEnum = z.enum([
  "Scholarship",
  "Internship",
  "Fellowship",
  "Competition",
  "Hackathon",
  "Grant",
  "Program",
]);

export const OpportunitySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9-]+$/, {
    message: "Slug must be lowercase alphanumeric with hyphens only",
  }),
  description: z.string().min(20).max(2000),
  category: OpportunityCategoryEnum,
  organisation: z.string().max(200).optional(),
  tags: z.array(z.string().max(60)).max(30).default([]),
  countries: z
    .array(z.string().min(2).max(60))
    .min(1, "At least one country required"),
  deadline: z.coerce.date().nullable(),
  eligibility: z.object({
    countries: z.array(z.string().regex(/^[A-Z]{2}$/).refine((code) => COUNTRY_BY_CODE.has(code), "Country must be an African ISO alpha-2 code")).default([]),
    regions: z.array(z.enum(["AFRICA", "SSA", "NORTH_AFRICA", "GLOBAL"])).default([]),
    levels: z.array(z.enum(["highschool", "undergraduate", "postgraduate", "phd", "professional"])).default([]),
    fields: z.array(z.string()).default([]), genders: z.array(z.string()).optional(),
    ageMin: z.number().int().nonnegative().optional(), ageMax: z.number().int().positive().optional(), notes: z.string().optional(),
  }).optional(),
  funding: z.object({ type: z.enum(["full", "partial", "stipend", "none", "unknown"]).default("unknown"), amountText: z.string().optional(), currency: z.string().optional() }).optional(),
  status: z.enum(["open", "upcoming", "closed", "rolling", "unknown"]).optional(),
  cycle: z.object({ year: z.number().int().optional(), opensAt: z.coerce.date().optional(), closesAt: z.coerce.date().nullable().optional(), recurrence: z.enum(["annual", "biannual", "rolling", "one-off"]).optional(), nextExpectedWindow: z.string().optional() }).optional(),
  deadlineNote: z.string().max(120).optional(), timezone: z.string().max(80).refine((value) => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }, "Timezone must be a valid IANA timezone").optional(),
  source: z.object({ type: z.enum(["official", "aggregator", "community", "admin"]), url: z.string().url().optional() }).optional(),
  verifiedAt: z.coerce.date().optional(), verifiedBy: z.string().max(120).optional(), confidence: z.enum(["high", "medium", "low"]).optional(),
  lastLinkCheck: z.object({ at: z.coerce.date(), status: z.string(), httpCode: z.number().int().optional() }).optional(), needsReview: z.boolean().optional(),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  applicationSteps: z.array(z.string()).default([]),
  officialLink: z.string().url("Must be a valid URL"),
  image: z.string().url().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

/** Used for POST /api/opportunities (admin) */
export const CreateOpportunitySchema = OpportunitySchema;

/** Used for PATCH — all fields optional */
export const UpdateOpportunitySchema = OpportunitySchema.partial();

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
