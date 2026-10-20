import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Subscription confirmed", robots: { index: false } };

export default function ConfirmedPage() {
  return (
    <div className="container-site py-20">
      <div className="mx-auto max-w-lg text-center flex flex-col items-center gap-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold text-ink">You&apos;re confirmed</h1>
        <p className="text-muted">Your email is verified. The next weekly digest will arrive in your inbox.</p>
        <Link href="/opportunities" className="btn-primary">Browse opportunities</Link>
      </div>
    </div>
  );
}
