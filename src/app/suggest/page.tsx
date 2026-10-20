import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";

export const metadata: Metadata = {
  title: "Suggest an opportunity",
  description: "Tell StudentOS Africa about a scholarship, fellowship, internship or student benefit worth verifying.",
  alternates: { canonical: "/suggest" },
};

export default function SuggestPage() {
  return (
    <div className="container-site py-10 md:py-14">
      <Link href="/contact" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to contact
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex flex-col gap-2">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-forest">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> Community contributors
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Suggest something worth verifying</h1>
          <p className="text-sm text-muted">
            Found a real opportunity or a benefit that works in your country? Send the official link. We check every suggestion
            before publishing and never invent deadlines or amounts.
          </p>
        </div>

        <SuggestionForm />
      </div>
    </div>
  );
}
