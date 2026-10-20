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
  /** Issuing organisation, used for display, search and dedupe. */
  organisation?: string;
  /** Free-form topic tags used by search and the Finder. */
  tags?: string[];
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
  /** Field names explicitly edited by an admin/editor; automated ingestion must preserve them. */
  editedByAdmin?: string[];
  sourceUrl?: string;
  sourceHash?: string;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  linkCheckFailures?: number;
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
  organisation?: string;
  availability?: { countries: Record<string, "works" | "partial" | "blocked" | "unknown">; notes?: string; updatedAt?: Date };
  verificationMethod?: string;
  paymentNotes?: string;
  /** Practical guidance verified by the editorial team. */
  guidance?: BenefitGuidance;
  /** Moderated community tips. */
  tips?: BenefitTip[];
  tags?: string[];
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
  editedByAdmin?: string[];
  sourceUrl?: string;
  sourceHash?: string;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  linkCheckFailures?: number;
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
  editedByAdmin?: string[];
  sourceUrl?: string;
  sourceHash?: string;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
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
  editedByAdmin?: string[];
  sourceUrl?: string;
  sourceHash?: string;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

export interface BenefitGuidance {
  documentsAccepted?: string[];
  schoolEmailRequired?: "yes" | "no" | "varies" | "unknown";
  paymentWorkarounds?: string[];
  commonRejectionReasons?: string[];
  updatedAt?: Date;
}

export interface BenefitTip {
  body: string;
  helpful: number;
  submittedBy?: string;
  createdAt: Date;
  published: boolean;
}

// ─── Community Report ──────────────────────────────────────────────────────

/** Legacy moderation field retained for pre-v2 rows. */
export type ReportStatus = "approved" | "rejected" | "pending";
export type ReportOutcome = "worked" | "partial" | "failed" | "unknown";
export type ReportModeration = "pending" | "approved" | "rejected";

export interface Report {
  _id?: ObjectId;
  /** References Benefit._id */
  benefitId: string;
  /** Server-resolved Benefit title snapshot */
  benefitTitle: string;
  school: string;
  country: string;
  /** ISO alpha-2 code derived from country when recognisable. */
  countryCode?: string;
  /** @deprecated Use moderation. Kept so pre-v2 records keep loading. */
  status?: ReportStatus;
  moderation?: ReportModeration;
  outcome?: ReportOutcome;
  verificationMethod?: "school-email" | "student-id" | "document" | "other" | "none" | "unknown";
  timeToApproveDays?: number | null;
  paymentIssue?: { occurred: boolean; notes?: string };
  reportDate?: Date;
  comment: string;
  /** Optional, lower-cased contact for the moderation decision. Never shown publicly. */
  submitterEmail?: string;
  /** Normalised comment hash used for duplicate detection. */
  commentHash?: string;
  /** Moderation note added by admin */
  adminNote?: string;
  /** Reason shared with the submitter when a report is rejected. */
  moderationReason?: string;
  moderatedAt?: Date;
  createdAt: Date;
}

// ─── Newsletter ────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  _id?: ObjectId;
  email: string;
  status?: "pending" | "confirmed" | "unsubscribed";
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  consentAt?: Date;
  consentPurpose?: string;
  source?: string;
  /** Sendhiiv subscriber ID after successful sync */
  sendhiivId?: string;
  createdAt: Date;
}

export interface StudentUser {
  _id?: ObjectId;
  email: string;
  name?: string;
  image?: string;
  role: "student" | "admin";
  country?: string;
  level?: "highschool" | "undergraduate" | "postgraduate" | "phd" | "professional";
  fields?: string[];
  consentAt?: Date;
  /** Quiet opt-out from deadline reminder emails. */
  remindersOptOut?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedItem {
  _id?: ObjectId;
  userEmail: string;
  opportunitySlug: string;
  opportunityTitle: string;
  /** Application tracker stage. */
  stage: "saved" | "preparing" | "submitted" | "result";
  notes?: string;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderSent {
  _id?: string;
  userEmail: string;
  forDate: string;
  items: string[];
  sentAt: Date;
}

// ─── AI Finder ─────────────────────────────────────────────────────────────

export interface FinderInput {
  country: string;
  course: string;
  level: "undergraduate" | "postgraduate" | "phd" | "professional";
  interests: string[];
  careerGoal: string;
}

export interface FinderPick {
  slug: string;
  title: string;
  category: OpportunityCategory;
  deadline: Date | null;
  description: string;
  funding?: Opportunity["funding"];
  reason: string;
  matchedCriteria: string[];
  score: number;
}

export interface FinderResult {
  picks: FinderPick[];
  /** Explanation from the model, or a deterministic summary when AI is off. */
  explanation: string;
  /** How many candidates survived the deterministic filter. */
  considered: number;
  /** Whether the explanation came from the model. */
  ai: boolean;
  note?: string;
  shareUrl?: string;
  cached?: boolean;
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
