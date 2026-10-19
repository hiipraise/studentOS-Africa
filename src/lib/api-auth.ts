import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Returns the authenticated admin's user ID, or sends a 401 response.
 * Use at the top of any protected API route handler.
 */
export async function requireAdminApi() {
  const unauthorized = () => ({
    userId: null,
    errorResponse: NextResponse.json<ApiResponse<never>>(
      { success: false, error: "unauthorized" },
      { status: 401 }
    ),
  });
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) return unauthorized();

  const session = await auth();

  const allowlist = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (!session?.user?.email || !allowlist.has(session.user.email.toLowerCase())) {
    return unauthorized();
  }

  return { userId: session.user.id ?? session.user.email!, errorResponse: null };
}
