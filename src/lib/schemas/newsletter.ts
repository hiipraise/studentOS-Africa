import { z } from "zod";

export const SubscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").transform((value) => value.toLowerCase()),
  source: z.string().max(40).optional(),
  consent: z.boolean().optional(),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
