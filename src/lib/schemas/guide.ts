import { z } from "zod";

export const GuideSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(20).max(400),
  content: z.string().min(50),
  tags: z.array(z.string().min(1).max(40)).default([]),
  relatedBenefitSlug: z.string().optional(),
  image: z.string().url().optional(),
  readingTimeMinutes: z.number().int().min(1).default(5),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export const CreateGuideSchema = GuideSchema;
export const UpdateGuideSchema = GuideSchema.partial();

export type CreateGuideInput = z.infer<typeof CreateGuideSchema>;
export type UpdateGuideInput = z.infer<typeof UpdateGuideSchema>;
