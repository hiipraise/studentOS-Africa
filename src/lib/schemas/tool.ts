import { z } from "zod";

export const ToolCategoryEnum = z.enum([
  "AI",
  "Coding",
  "Design",
  "Research",
  "Productivity",
  "Learning",
]);

export const ToolSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(1000),
  category: ToolCategoryEnum,
  officialLink: z.string().url(),
  image: z.string().url().optional(),
  free: z.boolean().default(true),
  freeTier: z.string().max(300).optional(),
  studentOffer: z.boolean().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export const CreateToolSchema = ToolSchema;
export const UpdateToolSchema = ToolSchema.partial();

export type CreateToolInput = z.infer<typeof CreateToolSchema>;
export type UpdateToolInput = z.infer<typeof UpdateToolSchema>;
