import { z } from "zod";

export const SubscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").transform((value) => value.toLowerCase()),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
