import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function NewsletterCTA() {
  return (
    <section className="section">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-3xl bg-forest px-6 py-14 md:px-16 md:py-16">
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold-muted">
              📬 Weekly drops
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-white leading-tight">
              Never miss a deadline again.
            </h2>
            <p className="text-sm md:text-base text-white/70 max-w-md">
              Get the best scholarships, internships, and student benefits delivered
              to your inbox every week — curated, not spam.
            </p>
            <div className="w-full max-w-md pt-2">
              <NewsletterForm variant="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
