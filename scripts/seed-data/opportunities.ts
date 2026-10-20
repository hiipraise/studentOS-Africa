/**
 * REAL, VERIFIED opportunities — researched via live web search, not fabricated.
 *
 * Deliberately kept to a smaller, accurate set rather than padded with guessed
 * programs. Several have `deadline: null` because the official source gives a
 * *recurring window* (e.g. "opens January, closes ~March") rather than a fixed
 * date confirmed for the next cycle — showing a wrong specific date would be
 * worse than showing "Rolling / check official site".
 *
 * Categories NOT yet represented with a verified real example: Internship,
 * Hackathon, Program. Add these via the Admin Dashboard or scrapers once you
 * have verified current listings — don't want to ship guessed ones.
 */

import type { CreateOpportunityInput } from "@/lib/schemas/opportunity";

export const opportunitiesSeed: CreateOpportunityInput[] = [
  {
    title: "Mastercard Foundation Scholars Program",
    slug: "mastercard-foundation-scholars-program",
    description:
      "A pan-African scholarship program delivered through partner universities worldwide, covering full tuition, accommodation, and a living stipend for academically talented students facing financial barriers. Each partner institution (Cambridge, McGill, Sciences Po, Makerere, and many others) runs its own admissions and funding deadline.",
    category: "Scholarship",
    tags: [],
    countries: ["All African Countries"],
    deadline: null,
    requirements: [
      "Citizenship of an African country (dual citizenship outside Africa may disqualify some tracks)",
      "Meet the academic admission requirements of your chosen partner institution",
      "Demonstrated leadership and community engagement",
      "Demonstrated financial need",
    ],
    benefits: [
      "Full tuition coverage",
      "Accommodation and living stipend",
      "Mentorship and leadership development",
      "Lifetime access to the Scholars alumni network",
    ],
    applicationSteps: [
      "Choose a Mastercard Foundation Scholars Program partner institution",
      "Apply for admission to your chosen degree program at that institution",
      "Opt in for Mastercard Foundation funding during the application (where offered)",
      "Submit all required documents by your partner institution's specific funding deadline",
    ],
    officialLink:
      "https://mastercardfdn.org/en/what-we-do/our-programs/mastercard-foundation-scholars-program/",
    featured: true,
    published: true,
  },
  {
    title: "Chevening Scholarships",
    slug: "chevening-scholarships",
    description:
      "The UK government's global scholarship programme, funded by the Foreign, Commonwealth & Development Office. Chevening funds a fully-funded one-year Master's degree at any UK university, along with leadership training and a lifelong international network. Open to citizens of more than 160 countries and territories, including most African nations.",
    category: "Scholarship",
    tags: [],
    countries: ["Nigeria", "Kenya", "Ghana", "South Africa", "Ethiopia", "Uganda"],
    deadline: new Date("2026-10-07T12:00:00Z"),
    requirements: [
      "Citizen of a Chevening-eligible country",
      "Hold an undergraduate degree that qualifies you for a UK Master's programme",
      "At least 2,800 hours (roughly 2 years) of work experience",
      "Apply to three eligible UK university courses and secure at least one unconditional offer",
      "Commit to returning to your home country for at least two years after the award",
    ],
    benefits: [
      "Full UK university tuition fees",
      "Monthly stipend",
      "Return flights to and from the UK",
      "Arrival and departure allowances",
      "Cost of one UK visa application",
    ],
    applicationSteps: [
      "Confirm your country is on the Chevening-eligible list",
      "Create an account on the Chevening online application system",
      "Apply to three eligible UK university courses",
      "Submit your Chevening application before the deadline",
      "Secure an unconditional university offer and complete reference checks",
      "Attend an interview if shortlisted",
    ],
    officialLink: "https://www.chevening.org/scholarships/",
    featured: true,
    published: true,
  },
  {
    title: "Tony Elumelu Foundation Entrepreneurship Programme",
    slug: "tony-elumelu-foundation-entrepreneurship-programme",
    description:
      "Africa's flagship entrepreneurship philanthropy programme, providing non-refundable seed capital, twelve weeks of business training, and mentorship to early-stage entrepreneurs across all 54 African countries. Since 2015 the programme has funded over 24,000 entrepreneurs through TEFConnect.",
    category: "Grant",
    tags: [],
    countries: ["All 54 African Countries"],
    deadline: null,
    requirements: [
      "Citizen or legal resident of any African country",
      "Aged 18 or older",
      "Early-stage business (0–5 years old) at time of application",
      "Business idea or venture registered/operating in Africa",
    ],
    benefits: [
      "US$5,000 in non-refundable seed capital",
      "12 weeks of business management training",
      "One-on-one mentorship from experienced business professionals",
      "Access to the TEFConnect pan-African entrepreneurship network",
    ],
    applicationSteps: [
      "Create a free account on TEFConnect",
      "Complete your business profile and application form",
      "Submit during the annual application window (typically opens in January)",
      "Await shortlisting results and complete any further verification steps",
    ],
    officialLink: "https://www.tonyelumelufoundation.org/",
    featured: true,
    published: true,
  },
  {
    title: "Mandela Washington Fellowship (YALI)",
    slug: "mandela-washington-fellowship-yali",
    description:
      "The flagship exchange program of the U.S. Government's Young African Leaders Initiative (YALI), bringing accomplished young African leaders to the United States for a six-week Leadership Institute, a Summit in Washington D.C., and ongoing professional development opportunities.",
    category: "Fellowship",
    tags: [],
    countries: ["Sub-Saharan Africa"],
    deadline: null,
    requirements: [
      "Aged 25–35 (some exceptions made for ages 21–24)",
      "Citizen and resident of a Sub-Saharan African country",
      "Established record of leadership and accomplishment in business, civic engagement, or public service",
      "Proficiency in English",
    ],
    benefits: [
      "Six-week Leadership Institute at a U.S. college or university",
      "Mandela Washington Fellowship Summit in Washington, D.C.",
      "Networking with U.S. government, civic, and business leaders",
      "Eligibility for further Professional Development Experiences",
    ],
    applicationSteps: [
      "Create an account on the YALI Network",
      "Complete the online Fellowship application",
      "Submit before the annual deadline (typically in September for institutes the following summer)",
      "Complete an interview if shortlisted",
    ],
    officialLink: "https://www.mandelawashingtonfellowship.org/",
    featured: false,
    published: true,
  },
  {
    title: "DAAD Scholarships for African Students",
    slug: "daad-scholarships-african-students",
    description:
      "The German Academic Exchange Service (DAAD) offers a wide range of fully and partially funded scholarships for African students to pursue Bachelor's, Master's, and PhD study in Germany — where most public universities charge no tuition fees. Programmes and deadlines vary by field of study and degree level.",
    category: "Scholarship",
    tags: [],
    countries: ["All African Countries"],
    deadline: null,
    requirements: [
      "Completed or near-completion of the prerequisite degree for your chosen programme",
      "Strong academic record",
      "Relevant work experience for some Master's/PhD programmes",
      "German or English language proficiency depending on the specific programme",
    ],
    benefits: [
      "Tuition waiver at German public universities (most charge no tuition)",
      "Monthly stipend",
      "Travel allowance",
      "Health insurance coverage",
    ],
    applicationSteps: [
      "Search the DAAD scholarship database for programmes matching your field",
      "Note the specific deadline for your chosen programme",
      "Prepare required documents (transcripts, motivation letter, references)",
      "Submit your application via the DAAD portal or the partner university directly",
    ],
    officialLink: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    featured: false,
    published: true,
  },
  {
    title: "Resolution Social Venture Challenge",
    slug: "resolution-social-venture-challenge",
    description:
      "A global competition for young social entrepreneurs (25 and under) tackling problems in their own communities. Winners join the Resolution Fellowship for life — receiving seed funding, mentorship, and a lifelong network of peer social entrepreneurs.",
    category: "Competition",
    tags: [],
    countries: ["Global — Open to African Applicants"],
    deadline: null,
    requirements: [
      "Aged 25 or under at time of application",
      "Founder or co-founder of a social venture addressing a real community problem",
      "Committed to personally implementing the venture",
    ],
    benefits: [
      "US$1,000–$6,000 in seed funding",
      "Lifetime Resolution Fellowship membership and mentorship",
      "Invitations to global Resolution conferences",
    ],
    applicationSteps: [
      "Review the current challenge guidelines on the Resolution Project site",
      "Develop your social venture proposal",
      "Submit your application before the relevant regional deadline",
      "Complete a finalist interview if shortlisted",
    ],
    officialLink: "https://resolutionproject.org/",
    featured: false,
    published: true,
  },
];
