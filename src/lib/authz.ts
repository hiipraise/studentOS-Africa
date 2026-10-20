import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const emailSet = (value?: string) =>
  new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || (!emailSet(process.env.ADMIN_EMAILS).has(email) && !emailSet(process.env.EDITOR_EMAILS).has(email))) {
    redirect("/admin/login");
  }
  return session!;
}

export async function requireAdministrator() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !emailSet(process.env.ADMIN_EMAILS).has(email)) redirect("/admin/login");
  return session!;
}

export const requireEditor = requireAdmin;

/** Student pages: any signed-in account. */
export async function requireStudent() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/account");
  return session;
}

export async function getStudentEmail() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() ?? null;
}
