import type { Metadata } from "next";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return (
    <div className="container-site py-16 md:py-24">
      <div className="mx-auto max-w-lg flex flex-col gap-5">
        <h1 className="text-3xl font-bold text-ink">Email preferences</h1>
        {status === "unsubscribed" && <p className="rounded-lg bg-sage p-4 text-sm text-ink">You have been unsubscribed. You will not receive further newsletters or reminders.</p>}
        {status === "invalid" && <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">That link is invalid or has expired. Enter your email to manage your subscription.</p>}
        <p className="text-muted">We send one weekly digest, plus deadline reminders only for items you saved. No third-party marketing.</p>
        <NewsletterForm />
        <p className="text-xs text-muted">Subscribing again requires confirming a new email. This keeps the list clean and consent explicit.</p>
      </div>
    </div>
  );
}
