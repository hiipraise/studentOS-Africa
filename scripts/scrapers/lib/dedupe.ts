export function normalizeFingerprintText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function organizationFromUrl(value: string) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return "unknown"; }
}

export function opportunityFingerprint(input: { title: string; officialLink: string; cycleYear?: number }) {
  const title = normalizeFingerprintText(input.title);
  const org = organizationFromUrl(input.officialLink);
  const year = input.cycleYear ?? 0;
  return { key: `${title}|${org}|${year}`, title, org, year };
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = saved;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length);
}

export function findDuplicate<T extends { title?: string; officialLink?: string; cycle?: { year?: number }; deadline?: Date | null }>(candidate: { title: string; officialLink: string; cycleYear?: number }, existing: T[], threshold = 0.92) {
  const fingerprint = opportunityFingerprint(candidate);
  for (const record of existing) {
    if (!record.title || !record.officialLink) continue;
    const other = opportunityFingerprint({ title: record.title, officialLink: record.officialLink, cycleYear: record.cycle?.year ?? record.deadline?.getFullYear() });
    if (other.org === fingerprint.org && other.year === fingerprint.year && similarity(other.title, fingerprint.title) >= threshold) return record;
  }
  return null;
}
