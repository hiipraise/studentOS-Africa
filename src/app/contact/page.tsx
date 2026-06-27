import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the StudentOS Africa team.",
};

export default function ContactPage() {
  return (
    <div className="container-site py-16 md:py-24">
      <div className="mx-auto max-w-lg flex flex-col items-center text-center gap-6">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">Get in Touch</h1>
        <p className="text-muted leading-relaxed">
          Found an outdated listing? Want to suggest an opportunity? We&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
          <a
            href="mailto:hello@studentos.africa"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-6 hover:border-forest/30 hover:shadow-sm transition-all"
          >
            <Mail className="h-5 w-5 text-forest" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">Email Us</span>
            <span className="text-xs text-muted">hello@studentos.africa</span>
          </a>

          <a
            href="https://twitter.com/studentosafrica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-6 hover:border-forest/30 hover:shadow-sm transition-all"
          >
            <MessageCircle className="h-5 w-5 text-forest" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">Twitter / X</span>
            <span className="text-xs text-muted">@studentosafrica</span>
          </a>
        </div>
      </div>
    </div>
  );
}
