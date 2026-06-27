import type { Metadata } from "next";
import { Mail, TrendingUp, Clock } from "lucide-react";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Get scholarships, internships, and student benefits delivered to your inbox every week.",
};

const PERKS = [
  { icon: TrendingUp, text: "Curated deadlines closing soon" },
  { icon: Mail, text: "New benefits and free tools weekly" },
  { icon: Clock, text: "5-minute read, every Sunday" },
];

export default function NewsletterPage() {
  return (
    <div className="container-site py-16 md:py-24">
      <div className="mx-auto max-w-lg flex flex-col items-center text-center gap-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest/10 text-forest">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </span>

        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
          Join the StudentOS Newsletter
        </h1>
        <p className="text-muted leading-relaxed">
          The best scholarships, internships, fellowships, and student benefits —
          curated and delivered to your inbox every week.
        </p>

        <div className="w-full">
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-6">
          {PERKS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4">
              <Icon className="h-4 w-4 text-forest" aria-hidden="true" />
              <p className="text-xs text-muted leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted pt-2">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
