import { z } from "zod";

export const BenefitSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(2000),
  eligibility: z.string().min(5).max(500),
  availability: z.object({ countries: z.record(z.string().regex(/^[A-Z]{2}$/), z.enum(["works", "partial", "blocked", "unknown"])), notes: z.string().optional() }).optional(),
  verificationMethod: z.string().max(120).optional(),
  paymentNotes: z.string().max(1000).optional(),
  lastChecked: z.coerce.date().optional(),
  verifiedBy: z.string().max(120).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  requirements: z.array(z.string()).default([]),
  officialLink: z.string().url(),
  guideLink: z.string().url().optional(),
  image: z.string().url().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export const CreateBenefitSchema = BenefitSchema;
export const UpdateBenefitSchema = BenefitSchema.partial();

export type CreateBenefitInput = z.infer<typeof CreateBenefitSchema>;
export type UpdateBenefitInput = z.infer<typeof UpdateBenefitSchema>;
