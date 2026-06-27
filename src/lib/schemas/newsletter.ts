import { z } from "zod";

export const SubscribeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
