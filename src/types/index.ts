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

// ─── Benefit ───────────────────────────────────────────────────────────────

export interface Benefit {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  eligibility: string;
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

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface Admin {
  _id?: ObjectId;
  email: string;
  /** bcrypt hash — never expose raw */
  passwordHash: string;
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
