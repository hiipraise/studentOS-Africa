"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GraduationCap } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-white p-8 shadow-sm text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-forest" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to StudentOS</h1>
          <p className="mt-2 text-sm text-muted">Save opportunities, track applications and get deadline reminders.</p>
          <button onClick={() => signIn("google", { callbackUrl })} className="btn-primary mt-6 w-full">Continue with Google</button>
          <p className="mt-4 text-xs text-muted">We store only your email, name and the profile details you add. Export or delete your data anytime.</p>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Administrator? <Link href="/admin/login" className="underline">Use the admin sign-in</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-[70vh]" aria-label="Loading sign-in" />}><LoginContent /></Suspense>;
}
