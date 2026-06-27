import { z } from "zod";

export const ReportStatusEnum = z.enum(["approved", "rejected", "pending"]);

export const CreateReportSchema = z.object({
  benefitId: z.string().min(1, "benefitId is required"),
  benefitTitle: z.string().min(1),
  school: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  status: ReportStatusEnum,
  comment: z.string().min(10).max(1000),
});

/** Admin-only patch: moderate a report */
export const ModerateReportSchema = z.object({
  status: ReportStatusEnum,
  adminNote: z.string().max(500).optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ModerateReportInput = z.infer<typeof ModerateReportSchema>;
