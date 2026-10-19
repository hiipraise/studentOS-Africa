import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allowed = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  const editors = new Set((process.env.EDITOR_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (!email || (!allowed.has(email) && !editors.has(email))) redirect("/admin/login");
  return session!;
}

export async function requireAdministrator() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allowed = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (!email || !allowed.has(email)) redirect("/admin/login");
  return session!;
}

export const requireEditor = requireAdmin;
