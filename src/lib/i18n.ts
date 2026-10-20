export type Locale = "en" | "fr";
export const LOCALE_COOKIE = "studentos_locale";

export const dictionaries = {
  en: {
    "nav.opportunities": "Opportunities",
    "nav.benefits": "Benefits",
    "nav.tools": "Tools",
    "nav.guides": "Guides",
    "nav.reports": "Reports",
    "nav.finder": "AI Finder",
    "nav.newsletter": "Join Newsletter",
    "nav.saved": "Saved",
    "hero.eyebrow": "Built for African students",
    "hero.words": "Scholarships.|Fellowships.|Internships.|Grants.|Hackathons.",
    "hero.built": "Built for Africa.",
    "hero.subhead": "Scholarships, internships, fellowships, student benefits, and free tools — all in one place, curated for students across the continent.",
    "hero.stat1": "🎓 Scholarships across 30+ countries",
    "hero.stat2": "🛠️ Free student tools",
    "hero.stat3": "📬 Weekly opportunity drops",
    "footer.platform": "Platform",
    "footer.resources": "Resources",
    "footer.company": "Company",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.tagline": "Opportunities, benefits and tools for African students.",
    "opps.title": "Opportunities",
    "opps.subtitle": "Open scholarships, fellowships, internships, grants and programmes for African students.",
    "common.closingSoon": "Closing soon",
    "common.deadlines": "Deadlines",
    "common.clearAll": "Clear all",
    "common.showClosed": "Show closed",
  },
  fr: {
    "nav.opportunities": "Opportunités",
    "nav.benefits": "Avantages",
    "nav.tools": "Outils",
    "nav.guides": "Guides",
    "nav.reports": "Témoignages",
    "nav.finder": "Chercheur IA",
    "nav.newsletter": "Newsletter",
    "nav.saved": "Enregistrés",
    "hero.eyebrow": "Conçu pour les étudiants africains",
    "hero.words": "Bourses.|Fellowships.|Stages.|Subventions.|Hackathons.",
    "hero.built": "Conçu pour l’Afrique.",
    "hero.subhead": "Bourses, stages, fellowships, avantages étudiants et outils gratuits — réunis au même endroit pour les étudiants du continent.",
    "hero.stat1": "🎓 Bourses dans plus de 30 pays",
    "hero.stat2": "🛠️ Outils étudiants gratuits",
    "hero.stat3": "📬 Sélection hebdomadaire",
    "footer.platform": "Plateforme",
    "footer.resources": "Ressources",
    "footer.company": "Entreprise",
    "footer.about": "À propos",
    "footer.contact": "Contact",
    "footer.privacy": "Confidentialité",
    "footer.terms": "Conditions",
    "footer.tagline": "Opportunités, avantages et outils pour les étudiants africains.",
    "opps.title": "Opportunités",
    "opps.subtitle": "Bourses, fellowships, stages, subventions et programmes ouverts aux étudiants africains.",
    "common.closingSoon": "Bientôt clos",
    "common.deadlines": "Échéances",
    "common.clearAll": "Tout effacer",
    "common.showClosed": "Afficher les clôturés",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["en"];

export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries.en[key];
}

export function localeFromValue(value: string | undefined | null): Locale {
  return value === "fr" ? "fr" : "en";
}
