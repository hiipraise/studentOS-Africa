const ALWAYS_PROTECTED = new Set(["published", "featured", "verifiedAt", "verifiedBy", "confidence", "needsReview", "createdAt", "updatedAt", "_id"]);

/** Returns fields a scraper can refresh, excluding editorial decisions and per-field edits. */
export function scraperOwnedSet(existing: { editedByAdmin?: string[] }, proposed: Record<string, unknown>) {
  const edited = new Set(existing.editedByAdmin ?? []);
  return Object.fromEntries(Object.entries(proposed).filter(([field]) => !ALWAYS_PROTECTED.has(field) && !edited.has(field)));
}

export function contentChanged(existingHash: string | undefined, currentHash: string) {
  return Boolean(existingHash && existingHash !== currentHash);
}
