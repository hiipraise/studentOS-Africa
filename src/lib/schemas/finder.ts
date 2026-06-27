import { z } from "zod";

export const FinderInputSchema = z.object({
  country: z.string().min(2).max(100),
  course: z.string().min(2).max(200),
  level: z.enum(["undergraduate", "postgraduate", "phd", "professional"]),
  interests: z
    .array(z.string().min(1).max(60))
    .min(1, "At least one interest required")
    .max(10),
  careerGoal: z.string().min(5).max(300),
});

export type FinderInputData = z.infer<typeof FinderInputSchema>;
