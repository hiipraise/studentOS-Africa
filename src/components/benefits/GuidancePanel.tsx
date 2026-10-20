import { FileCheck2, Mail, CreditCard, ShieldX } from "lucide-react";
import type { BenefitGuidance } from "@/types";

export function GuidancePanel({ guidance }: { guidance?: BenefitGuidance }) {
  if (!guidance) return null;

  const sections = [
    { title: "Documents usually accepted", items: guidance.documentsAccepted, icon: FileCheck2 },
    { title: "Payment workarounds", items: guidance.paymentWorkarounds, icon: CreditCard },
    { title: "Common rejection reasons", items: guidance.commonRejectionReasons, icon: ShieldX },
  ].filter((section) => section.items && section.items.length > 0);

  const hasSchoolEmail = guidance.schoolEmailRequired && guidance.schoolEmailRequired !== "unknown";

  if (sections.length === 0 && !hasSchoolEmail) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Practical guidance</h2>
        <p className="mt-0.5 text-xs text-muted">Checked by the editorial team. Community tips are separate and clearly marked.</p>
      </div>

      {hasSchoolEmail && (
        <p className="inline-flex items-start gap-2 rounded-lg bg-sage/50 p-3 text-sm text-ink">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
          {guidance.schoolEmailRequired === "yes"
            ? "A school email address is required."
            : guidance.schoolEmailRequired === "no"
              ? "A school email is not required."
              : "Some students need a school email; it varies by account."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map(({ title, items, icon: Icon }) => (
          <div key={title} className="flex flex-col gap-1.5">
            <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Icon className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
              {title}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink/75">
              {items!.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {guidance.updatedAt && (
        <p className="text-xs text-muted">Guidance last updated {new Date(guidance.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.</p>
      )}
    </section>
  );
}
