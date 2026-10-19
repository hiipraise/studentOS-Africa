"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  return <div className="min-h-screen bg-canvas flex items-center justify-center px-4"><div className="w-full max-w-sm">
    <Link href="/" className="text-sm text-muted">← Back to StudentOS Africa</Link>
    <div className="mt-8 rounded-xl border border-border bg-white p-8 shadow-sm text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-forest" aria-hidden="true" />
      <h1 className="mt-4 text-display-sm font-display text-ink">Admin Login</h1>
      <p className="mt-2 text-sm text-muted">Sign in with an approved administrator Google account.</p>
      <button onClick={() => signIn("google", { callbackUrl })} className="btn-primary mt-6 w-full">Continue with Google</button>
    </div>
    <p className="mt-6 text-center text-xs text-muted">Access is limited to emails in the ADMIN_EMAILS environment setting.</p>
  </div></div>;
}

export default function AdminLoginPage() {
  return <Suspense fallback={<div className="min-h-screen" aria-label="Loading sign-in" />}><AdminLoginContent /></Suspense>;
}
