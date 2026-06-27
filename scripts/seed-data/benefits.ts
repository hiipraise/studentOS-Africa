/**
 * REAL student benefits — all stable, well-known, verifiable programs.
 * Lower factual risk than time-sensitive opportunities since these don't
 * have hard deadlines, but link/eligibility details can still drift —
 * worth a periodic re-check.
 */

import type { CreateBenefitInput } from "@/lib/schemas/benefit";

export const benefitsSeed: CreateBenefitInput[] = [
  {
    title: "GitHub Student Developer Pack",
    slug: "github-student-developer-pack",
    description:
      "Free access to the best developer tools, all in one place — domains, hosting, APIs, IDEs, and more — bundled specifically for verified students. Includes free GitHub Copilot, JetBrains licenses, a free .me domain, and dozens of other partner offers.",
    eligibility: "Currently enrolled student aged 13+ at a degree-granting school or university",
    requirements: [
      "Proof of current enrollment (school-issued email preferred, or alternative documents)",
      "A GitHub account",
    ],
    officialLink: "https://education.github.com/pack",
    guideLink: "/guides/how-students-get-github-student-pack",
    featured: true,
    published: true,
  },
  {
    title: "JetBrains Student License",
    slug: "jetbrains-student-license",
    description:
      "Free access to JetBrains' full suite of professional IDEs — IntelliJ IDEA Ultimate, PyCharm Professional, WebStorm, and more — for the duration of your studies, renewable annually.",
    eligibility: "Student or faculty member at an accredited educational institution",
    requirements: ["Proof of academic status via school email or document upload"],
    officialLink: "https://www.jetbrains.com/community/education/#students",
    featured: true,
    published: true,
  },
  {
    title: "Notion Education Plan",
    slug: "notion-education-plan",
    description:
      "Notion's Plus plan free for students and educators — unlimited blocks, file uploads, and collaborators, normally a paid tier for individuals.",
    eligibility: "Student or educator with a valid school email address",
    requirements: ["Verification via school-issued email address"],
    officialLink: "https://www.notion.so/notion-for-education",
    featured: true,
    published: true,
  },
  {
    title: "Figma Education",
    slug: "figma-education",
    description:
      "Free access to Figma and FigJam's professional plan features for students and educators, including unlimited files, version history, and team libraries.",
    eligibility: "Currently enrolled student or verified educator",
    requirements: ["Verification via school email or enrollment document"],
    officialLink: "https://www.figma.com/education/",
    featured: true,
    published: true,
  },
  {
    title: "Canva for Education",
    slug: "canva-for-education",
    description:
      "Canva's premium design features made available to eligible students and teachers, including premium templates, stock photos, and brand kit tools.",
    eligibility: "K-12 students/teachers fully free; higher-ed students get discounted Canva Pro via partner offers",
    requirements: ["School verification depends on institution type and country"],
    officialLink: "https://www.canva.com/education/",
    featured: false,
    published: true,
  },
  {
    title: "Microsoft Azure for Students",
    slug: "microsoft-azure-for-students",
    description:
      "Free Azure cloud credits and developer tools for students — no credit card required. Includes access to virtual machines, databases, and AI services to learn cloud development.",
    eligibility: "Student aged 18+ with a valid school email address",
    requirements: ["Verification via school email"],
    officialLink: "https://azure.microsoft.com/en-us/free/students/",
    featured: false,
    published: true,
  },
  {
    title: "Adobe Creative Cloud Student Discount",
    slug: "adobe-creative-cloud-student-discount",
    description:
      "A significant discount (not fully free) on Adobe's full Creative Cloud suite — Photoshop, Illustrator, Premiere Pro, and more — for verified students and teachers.",
    eligibility: "Student or teacher at an accredited educational institution",
    requirements: ["Proof of enrollment, verified through Adobe's partner SheerID"],
    officialLink: "https://www.adobe.com/creativecloud/buy/students.html",
    featured: false,
    published: true,
  },
  {
    title: "Spotify Premium Student",
    slug: "spotify-premium-student",
    description:
      "Discounted Spotify Premium (with Hulu and Showtime bundled in supported regions) for verified students, renewable each year of study.",
    eligibility: "Student aged 18+ enrolled at an accredited post-secondary institution",
    requirements: ["Verification via SheerID using school enrollment proof"],
    officialLink: "https://www.spotify.com/student/",
    featured: false,
    published: true,
  },
];
