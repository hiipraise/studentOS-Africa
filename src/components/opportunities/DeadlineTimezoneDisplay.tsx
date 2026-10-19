"use client";
import { useEffect, useState } from "react";

export function DeadlineTimezoneDisplay({ deadline, timezone = "UTC", note }: { deadline: Date | string; timezone?: string; note?: string }) {
  const [studentTimezone, setStudentTimezone] = useState("");
  const instant = new Date(deadline);
  const programDate = new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: timezone }).format(instant);
  useEffect(() => setStudentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  return <div className="text-sm text-muted"><p>Programme timezone: {programDate} ({timezone}){note ? ` · ${note}` : ""}</p>{studentTimezone && <p>Your timezone: {new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: studentTimezone }).format(instant)} ({studentTimezone})</p>}</div>;
}
