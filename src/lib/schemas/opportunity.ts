import { z } from "zod";

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
  countries: z
    .array(z.string().min(2).max(60))
    .min(1, "At least one country required"),
  deadline: z.coerce.date().nullable(),
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
