import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-forest">
        <WifiOff className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold text-ink">You are offline</h1>
      <p className="max-w-[42ch] text-sm text-muted">
        The pages you opened recently are cached, including your saved list. Reconnect to load fresh deadlines.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/saved" className="btn-primary">Open saved list</Link>
        <Link href="/opportunities" className="btn-ghost rounded-lg border border-border">Browse cached opportunities</Link>
      </div>
    </div>
  );
}
