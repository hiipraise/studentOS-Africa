import { describe, expect, it } from "vitest";
import { deriveStatus, getOpportunityStatus, reopenLabel } from "@/lib/domain/status";

const now = new Date("2026-10-19T12:00:00.000Z");
describe("opportunity status engine", () => {
  it("returns upcoming before the opening instant", () => expect(deriveStatus({ opensAt: "2026-10-19T14:00:00+01:00", closesAt: "2026-11-01T00:00:00Z" }, now)).toBe("upcoming"));
  it("returns open at the opening instant and before close", () => expect(deriveStatus({ opensAt: "2026-10-19T13:00:00+01:00", closesAt: "2026-10-20T00:00:00Z" }, now)).toBe("open"));
  it("treats the closing instant as closed across timezone offsets", () => expect(deriveStatus({ closesAt: "2026-10-19T15:00:00+03:00" }, now)).toBe("closed"));
  it("returns rolling for rolling recurrence", () => expect(deriveStatus({ recurrence: "rolling" }, now)).toBe("rolling"));
  it("returns unknown without cycle timing", () => expect(deriveStatus({}, now)).toBe("unknown"));
  it("uses a stored status override and reports recurring reopen windows", () => {
    expect(getOpportunityStatus({ status: "closed", deadline: null }, now)).toBe("closed");
    expect(reopenLabel({ recurrence: "annual", nextExpectedWindow: "January 2027" })).toBe("Usually reopens January 2027");
    expect(reopenLabel({ recurrence: "one-off" })).toBeNull();
  });
});
