import { ObjectId } from "mongodb";

// ─── Shared ────────────────────────────────────────────────────────────────

export type WithId<T> = T & { _id: ObjectId };

// ─── Opportunity ───────────────────────────────────────────────────────────

export type OpportunityCategory =
  | "Scholarship"
  | "Internship"
  | "Fellowship"
  | "Competition"
  | "Hackathon"
  | "Grant"
  | "Program";

export interface Opportunity {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  category: OpportunityCategory;
  /** ISO 3166-1 alpha-2 codes or "Global" */
  countries: string[];
  /** null means rolling / no fixed deadline */
  deadline: Date | null;
  eligibility?: OpportunityEligibility;
  funding?: { type: "full" | "partial" | "stipend" | "none" | "unknown"; amountText?: string; currency?: string };
  status?: OpportunityStatus;
  cycle?: OpportunityCycle;
  deadlineNote?: string;
  timezone?: string;
  source?: { type: "official" | "aggregator" | "community" | "admin"; url?: string };
  verifiedAt?: Date;
  verifiedBy?: string;
  confidence?: "high" | "medium" | "low";
  lastLinkCheck?: { at: Date; status: string; httpCode?: number };
  needsReview?: boolean;
  requirements: string[];
  /** What the recipient gets */
  benefits: string[];
  applicationSteps: string[];
  officialLink: string;
  /** Cloudinary URL */
  image?: string;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OpportunityStatus = "open" | "upcoming" | "closed" | "rolling" | "unknown";
export interface OpportunityCycle {
  year?: number;
  opensAt?: Date;
  closesAt?: Date | null;
  recurrence?: "annual" | "biannual" | "rolling" | "one-off";
  nextExpectedWindow?: string;
}
export interface OpportunityEligibility {
  countries: string[];
  regions: string[];
  levels: ("highschool" | "undergraduate" | "postgraduate" | "phd" | "professional")[];
  fields: string[];
  genders?: string[];
  ageMin?: number;
  ageMax?: number;
  notes?: string;
}

// ─── Benefit ───────────────────────────────────────────────────────────────

export interface Benefit {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  eligibility: string;
  availability?: { countries: Record<string, "works" | "partial" | "blocked" | "unknown">; notes?: string };
  verificationMethod?: string;
  paymentNotes?: string;
  lastChecked?: Date;
  needsReview?: boolean;
  verifiedBy?: string;
  confidence?: "high" | "medium" | "low";
  requirements: string[];
  officialLink: string;
  /** Link to the StudentOS guide for claiming this benefit */
  guideLink?: string;
  /** Cloudinary URL */
  image?: string;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Tool ──────────────────────────────────────────────────────────────────

export type ToolCategory =
  | "AI"
  | "Coding"
  | "Design"
  | "Research"
  | "Productivity"
  | "Learning";

export interface Tool {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  category: ToolCategory;
  officialLink: string;
  /** Cloudinary URL */
  image?: string;
  free: boolean;
  freeTier?: string;
  studentOffer?: boolean;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Guide ─────────────────────────────────────────────────────────────────

export interface Guide {
  _id?: ObjectId;
  title: string;
  slug: string;
  /** Short summary shown in cards */
  excerpt: string;
  /** Full MDX/Markdown content */
  content: string;
  tags: string[];
  /** Optional cross-link to a related benefit */
  relatedBenefitSlug?: string;
  /** Cloudinary URL */
  image?: string;
  readingTimeMinutes: number;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Community Report ──────────────────────────────────────────────────────

export type ReportStatus = "approved" | "rejected" | "pending";

export interface Report {
  _id?: ObjectId;
  /** References Benefit._id */
  benefitId: string;
  /** Benefit title snapshot (so reports are readable without joining) */
  benefitTitle: string;
  school: string;
  country: string;
  status: ReportStatus;
  comment: string;
  /** Moderation note added by admin */
  adminNote?: string;
  createdAt: Date;
}

// ─── Newsletter ────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  _id?: ObjectId;
  email: string;
  /** Sendhiiv subscriber ID after successful sync */
  sendhiivId?: string;
  createdAt: Date;
}

// ─── AI Finder ─────────────────────────────────────────────────────────────

export interface FinderInput {
  country: string;
  course: string;
  level: "undergraduate" | "postgraduate" | "phd" | "professional";
  interests: string[];
  careerGoal: string;
}

export interface FinderResult {
  opportunities: Pick<
    Opportunity,
    "title" | "slug" | "category" | "deadline" | "description"
  >[];
  benefits: Pick<Benefit, "title" | "slug" | "description">[];
  tools: Pick<Tool, "title" | "slug" | "category" | "description">[];
  guides: Pick<Guide, "title" | "slug" | "excerpt">[];
  /** AI-generated reasoning for why these were picked */
  explanation: string;
}

// ─── API Response wrapper ──────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
