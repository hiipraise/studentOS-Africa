import { z } from "zod";

export const BenefitSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(2000),
  eligibility: z.string().min(5).max(500),
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
