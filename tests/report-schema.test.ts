import { describe, expect, it } from "vitest";
import { CreateReportSchema, ModerateReportSchema } from "@/lib/schemas/report";

const valid = {
  benefitId: "507f1f77bcf86cd799439011",
  outcome: "worked" as const,
  country: "ng",
  school: "University of Lagos",
  comment: "It took three days and the school email was enough.",
};

describe("report schema v2", () => {
  it("accepts a normal report and upper-cases the country code", () => {
    const parsed = CreateReportSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.country).toBe("NG");
  });

  it("requires a benefit id so the title is resolved on the server", () => {
    const parsed = CreateReportSchema.safeParse({ ...valid, benefitId: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown outcome", () => {
    const parsed = CreateReportSchema.safeParse({ ...valid, outcome: "approved" });
    expect(parsed.success).toBe(false);
  });

  it("lower-cases an optional submitter email and rejects a broken one", () => {
    const parsed = CreateReportSchema.safeParse({ ...valid, submitterEmail: "Student@Example.COM" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.submitterEmail).toBe("student@example.com");
    expect(CreateReportSchema.safeParse({ ...valid, submitterEmail: "not-an-email" }).success).toBe(false);
  });

  it("accepts the anti-spam fields without trusting them", () => {
    const parsed = CreateReportSchema.safeParse({ ...valid, website: "", startedAt: Date.now(), turnstileToken: "token" });
    expect(parsed.success).toBe(true);
  });

  it("separates outcome from moderation", () => {
    expect(ModerateReportSchema.safeParse({ moderation: "approved" }).success).toBe(true);
    expect(ModerateReportSchema.safeParse({ moderation: "worked" }).success).toBe(false);
    expect(ModerateReportSchema.safeParse({ moderation: "rejected", moderationReason: "Duplicate", outcome: "partial" }).success).toBe(true);
  });
});
