import type { Opportunity, OpportunityStatus } from "@/types";

export interface StatusInput { opensAt?: Date | string | null; closesAt?: Date | string | null; deadline?: Date | string | null; recurrence?: "annual" | "biannual" | "rolling" | "one-off"; nextExpectedWindow?: string }
function instant(value?: Date | string | null): number | null {
  if (value == null) return null;
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : null;
}
export function deriveStatus(cycle: StatusInput, now = new Date()): OpportunityStatus {
  if (cycle.recurrence === "rolling") return "rolling";
  const opening = instant(cycle.opensAt);
  const closing = instant(cycle.closesAt) ?? instant(cycle.deadline);
  const t = now.getTime();
  if (opening !== null && t < opening) return "upcoming";
  if (closing !== null) return t < closing ? "open" : "closed";
  return "unknown";
}
export function getOpportunityStatus(opportunity: Pick<Opportunity, "status" | "cycle" | "deadline">, now = new Date()): OpportunityStatus {
  if (opportunity.status === "closed") return "closed";
  const computed = deriveStatus({ ...opportunity.cycle, deadline: opportunity.cycle?.closesAt ?? opportunity.deadline }, now);
  return computed === "unknown" ? opportunity.status ?? computed : computed;
}
export function reopenLabel(cycle?: StatusInput): string | null {
  if (!cycle?.recurrence || cycle.recurrence === "one-off") return null;
  const expected = cycle.nextExpectedWindow;
  return expected ? `Usually reopens ${expected}` : cycle.recurrence === "rolling" ? "Applications are rolling" : `Usually reopens next ${cycle.recurrence === "annual" ? "year" : "cycle"}`;
}
