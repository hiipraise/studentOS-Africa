import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow login page, Next.js internals, and Auth.js API routes
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Protect all admin routes
  if (pathname.startsWith("/admin")) {
    const allowed = new Set([...(process.env.ADMIN_EMAILS ?? "").split(","), ...(process.env.EDITOR_EMAILS ?? "").split(",")].map((email) => email.trim().toLowerCase()).filter(Boolean));
    const email = req.auth?.user?.email?.toLowerCase();
    if (!email || !allowed.has(email)) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
