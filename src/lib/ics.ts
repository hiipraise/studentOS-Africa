/** Minimal RFC 5545 calendar writer with 7/3/1-day alarms. */

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  url?: string;
  date: Date;
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function fold(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

export function buildIcs(events: CalendarEvent[], name = "StudentOS Africa deadlines"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudentOS Africa//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeText(name)}`),
  ];
  for (const event of events) {
    const description = [event.description, event.url ? `Apply: ${event.url}` : ""].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}@studentos.africa`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(event.date)}`,
      `DTEND:${stamp(new Date(event.date.getTime() + 30 * 60_000))}`,
      fold(`SUMMARY:${escapeText(event.title)}`),
      fold(`DESCRIPTION:${escapeText(description)}`),
      event.url ? fold(`URL:${event.url}`) : "",
      "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:One week until the deadline", "END:VALARM",
      "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:Three days until the deadline", "END:VALARM",
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Tomorrow is the deadline", "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function icsResponse(ics: string, filename: string) {
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-z0-9-_.]/gi, "-")}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
