import { z } from "zod";

export const SuggestionKindEnum = z.enum(["opportunity", "benefit", "correction"]);

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value.toLowerCase() : undefined))
  .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email or leave it blank");

export const CreateSuggestionSchema = z.object({
  kind: SuggestionKindEnum,
  title: z.string().trim().min(3, "Give it a short title").max(200),
  url: z.string().trim().url("Enter the official link").max(500).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional(),
  details: z.string().trim().min(20, "Add at least 20 characters of detail").max(1500),
  submitterEmail: optionalEmail,
  /** Honeypot and anti-bot fields, handled by the route. */
  website: z.string().max(200).optional(),
  startedAt: z.coerce.number().int().nonnegative().optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type CreateSuggestionInput = z.infer<typeof CreateSuggestionSchema>;
