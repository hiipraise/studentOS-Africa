export interface LocalSavedItem {
  slug: string;
  title: string;
  deadline?: string | null;
}

const KEY = "studentos:saved";

export function readLocalSaved(): LocalSavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalSavedItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.slug === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function writeLocalSaved(items: LocalSavedItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 100)));
}

export function toggleLocalSaved(item: LocalSavedItem): boolean {
  const current = readLocalSaved();
  const exists = current.some((entry) => entry.slug === item.slug);
  writeLocalSaved(exists ? current.filter((entry) => entry.slug !== item.slug) : [...current, item]);
  return !exists;
}

export function clearLocalSaved() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
