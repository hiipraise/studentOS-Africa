import { z } from "zod";

/** What actually happened when the student tried to claim the benefit. */
export const ReportOutcomeEnum = z.enum(["worked", "partial", "failed"]);
/** Independent moderation state; never mixed with the student's outcome. */
export const ReportModerationEnum = z.enum(["pending", "approved", "rejected"]);
export const VerificationMethodEnum = z.enum([
  "school-email",
  "student-id",
  "document",
  "other",
  "none",
  "unknown",
]);

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value.toLowerCase() : undefined))
  .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email or leave it blank");

export const CreateReportSchema = z.object({
  /** MongoDB ObjectId (or legacy slug) of a real, published benefit. */
  benefitId: z.string().trim().min(1, "Choose a benefit from the list").max(120),
  outcome: ReportOutcomeEnum,
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(60)
    .transform((value) => (/^[a-z]{2}$/i.test(value) ? value.toUpperCase() : value)),
  school: z.string().trim().min(2, "School is required").max(200),
  verificationMethod: VerificationMethodEnum.optional(),
  timeToApproveDays: z.coerce.number().int().min(0).max(730).nullable().optional(),
  paymentIssue: z
    .object({
      occurred: z.boolean(),
      notes: z.string().trim().max(500).optional(),
    })
    .optional(),
  reportDate: z.coerce.date().optional(),
  comment: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1000),
  /** Optional so we can email a moderation decision back to the submitter. */
  submitterEmail: optionalEmail,
  /** Honeypot: real users never fill this in. */
  website: z.string().max(200).optional(),
  /** Epoch milliseconds when the form was rendered (time-to-submit check). */
  startedAt: z.coerce.number().int().nonnegative().optional(),
  /** Optional Cloudflare Turnstile token. */
  turnstileToken: z.string().max(4096).optional(),
});

/** Admin-only patch: moderate a report. */
export const ModerateReportSchema = z.object({
  moderation: ReportModerationEnum,
  moderationReason: z.string().trim().max(500).optional(),
  /** Admin can correct the recorded outcome without changing the student's words. */
  outcome: ReportOutcomeEnum.optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ModerateReportInput = z.infer<typeof ModerateReportSchema>;
