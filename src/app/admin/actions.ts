"use server";

import { getDb, Collections } from "@/lib/db";
import { requireEditor, requireAdministrator } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import type {
  Opportunity,
  Benefit,
  Tool,
  Guide,
  Report,
} from "@/types";
import { mapCountryText } from "@/lib/domain/countries";
import { deriveStatus } from "@/lib/domain/status";
import { OpportunitySchema } from "@/lib/schemas/opportunity";
import { BenefitSchema } from "@/lib/schemas/benefit";
import { ToolSchema } from "@/lib/schemas/tool";
import { GuideSchema } from "@/lib/schemas/guide";

async function audit(db: Awaited<ReturnType<typeof getDb>>, actor: string, collection: string, slug: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = new Set(after === null ? Object.keys(before ?? {}) : Object.keys(after ?? {}));
  const changes = Object.fromEntries([...keys].filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])).map((key) => [key, { from: before?.[key] ?? null, to: after?.[key] ?? null }]));
  await db.collection(Collections.auditLog).insertOne({ actor, collection, slug, changes, createdAt: new Date() });
}

function revalidateContent(type: string, slug?: string) {
  const route: Record<string, string> = { opportunities: "opportunities", benefits: "benefits", tools: "tools", guides: "guides" };
  revalidatePath("/"); revalidatePath(`/${route[type]}`); revalidatePath(`/admin/${route[type]}`);
  if (slug) revalidatePath(`/${route[type]}/${slug}`);
}

async function ensureUniqueSlug(db: Awaited<ReturnType<typeof getDb>>, collection: string, slug: string, oldSlug?: string) {
  const existing = await db.collection(collection).findOne({ slug, ...(oldSlug ? { slug: { $eq: slug, $ne: oldSlug } } : {}) });
  if (existing) throw new Error("That slug is already in use.");
}

function actor(session: NonNullable<Awaited<ReturnType<typeof requireEditor>>>) { return session.user?.email ?? "unknown"; }

function eligibilityFromLegacy(countries: string[]) {
  const mapped = countries.map(mapCountryText);
  return { countries: [...new Set(mapped.flatMap((item) => item?.codes ?? []))], regions: [...new Set(mapped.flatMap((item) => item?.regions ?? []))], levels: [] as NonNullable<Opportunity["eligibility"]>["levels"], fields: [], ...(mapped.some((item) => item === null) ? { notes: "Some legacy eligibility text needs review." } : {}) };
}

// ─── Opportunity actions ─────────────────────────────────────────────────────

export async function createOpportunity(data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const now = new Date();

  const doc: Opportunity = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    category: data.category as Opportunity["category"],
    countries: data.countries as string[],
    deadline: data.deadline ? new Date(data.deadline as string) : null,
    eligibility: eligibilityFromLegacy(data.countries as string[]), funding: { type: "unknown" },
    cycle: { closesAt: data.deadline ? new Date(data.deadline as string) : null },
    status: deriveStatus({ deadline: data.deadline ? new Date(data.deadline as string) : null }),
    source: { type: "admin", url: data.officialLink as string }, confidence: "low", needsReview: true,
    requirements: (data.requirements as string[]) ?? [],
    benefits: (data.benefits as string[]) ?? [],
    applicationSteps: (data.applicationSteps as string[]) ?? [],
    officialLink: data.officialLink as string,
    image: (data.image as string) || undefined,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    createdAt: now,
    updatedAt: now,
  };
  doc.editedByAdmin = Object.keys(doc).filter((field) => !["createdAt", "updatedAt", "editedByAdmin"].includes(field));

  OpportunitySchema.parse(doc);
  await ensureUniqueSlug(db, Collections.opportunities, doc.slug);

  await db.collection<Opportunity>(Collections.opportunities).insertOne(doc);
  await audit(db, actor(session), Collections.opportunities, doc.slug, null, doc as unknown as Record<string, unknown>);
  revalidateContent("opportunities", doc.slug);
  redirect("/admin/opportunities");
}

export async function updateOpportunity(slug: string, data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Opportunity>(Collections.opportunities).findOne({ slug });
  if (!before) throw new Error("Opportunity not found.");

  const update: Partial<Opportunity> = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    category: data.category as Opportunity["category"],
    countries: data.countries as string[],
    deadline: data.deadline ? new Date(data.deadline as string) : null,
    eligibility: eligibilityFromLegacy(data.countries as string[]), funding: { type: "unknown" },
    cycle: { closesAt: data.deadline ? new Date(data.deadline as string) : null },
    status: deriveStatus({ deadline: data.deadline ? new Date(data.deadline as string) : null }),
    source: { type: "admin", url: data.officialLink as string }, confidence: "low", needsReview: true,
    requirements: (data.requirements as string[]) ?? [],
    benefits: (data.benefits as string[]) ?? [],
    applicationSteps: (data.applicationSteps as string[]) ?? [],
    officialLink: data.officialLink as string,
    image: (data.image as string) || undefined,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    updatedAt: new Date(),
  };

  OpportunitySchema.parse({ ...before, ...update });
  await ensureUniqueSlug(db, Collections.opportunities, update.slug!, slug);

  await db
    .collection<Opportunity>(Collections.opportunities)
    .updateOne({ slug }, { $set: update, $addToSet: { editedByAdmin: { $each: Object.keys(update) } } });

  await audit(db, actor(session), Collections.opportunities, update.slug!, before as unknown as Record<string, unknown>, update as unknown as Record<string, unknown>);
  revalidateContent("opportunities", update.slug);
  redirect("/admin/opportunities");
}

export async function deleteOpportunity(slug: string) {
  const session = await requireAdministrator();
  const db = await getDb();
  const before = await db.collection<Opportunity>(Collections.opportunities).findOne({ slug });
  await db.collection<Opportunity>(Collections.opportunities).deleteOne({ slug });
  if (before) await audit(db, actor(session), Collections.opportunities, slug, before as unknown as Record<string, unknown>, null);
  revalidateContent("opportunities", slug);
}

export async function toggleOpportunityPublish(slug: string, current: boolean) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Opportunity>(Collections.opportunities).findOne({ slug });
  await db
    .collection<Opportunity>(Collections.opportunities)
    .updateOne({ slug }, { $set: { published: !current, updatedAt: new Date() } });
  if (before) await audit(db, actor(session), Collections.opportunities, slug, before as unknown as Record<string, unknown>, { ...before, published: !current });
  revalidateContent("opportunities", slug);
}

// ─── Benefit actions ─────────────────────────────────────────────────────────

export async function createBenefit(data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const now = new Date();

  const doc: Benefit = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    eligibility: data.eligibility as string,
    availability: (data.availability as Benefit["availability"]) ?? { countries: {} },
    verificationMethod: data.verificationMethod as string | undefined,
    paymentNotes: data.paymentNotes as string | undefined,
    lastChecked: data.lastChecked ? new Date(data.lastChecked as string) : undefined,
    verifiedBy: data.verifiedBy as string | undefined,
    confidence: data.confidence as Benefit["confidence"],
    requirements: (data.requirements as string[]) ?? [],
    officialLink: data.officialLink as string,
    guideLink: (data.guideLink as string) || undefined,
    image: (data.image as string) || undefined,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    createdAt: now,
    updatedAt: now,
  };
  doc.editedByAdmin = Object.keys(doc).filter((field) => !["createdAt", "updatedAt", "editedByAdmin"].includes(field));

  BenefitSchema.parse(doc);
  await ensureUniqueSlug(db, Collections.benefits, doc.slug);

  await db.collection<Benefit>(Collections.benefits).insertOne(doc);
  await audit(db, actor(session), Collections.benefits, doc.slug, null, doc as unknown as Record<string, unknown>);
  revalidateContent("benefits", doc.slug);
  redirect("/admin/benefits");
}

export async function updateBenefit(slug: string, data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Benefit>(Collections.benefits).findOne({ slug });
  if (!before) throw new Error("Benefit not found.");

  const update: Partial<Benefit> = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    eligibility: data.eligibility as string,
    availability: (data.availability as Benefit["availability"]) ?? { countries: {} },
    verificationMethod: data.verificationMethod as string | undefined,
    paymentNotes: data.paymentNotes as string | undefined,
    lastChecked: data.lastChecked ? new Date(data.lastChecked as string) : undefined,
    verifiedBy: data.verifiedBy as string | undefined,
    confidence: data.confidence as Benefit["confidence"],
    requirements: (data.requirements as string[]) ?? [],
    officialLink: data.officialLink as string,
    guideLink: (data.guideLink as string) || undefined,
    image: (data.image as string) || undefined,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    updatedAt: new Date(),
  };

  BenefitSchema.parse({ ...before, ...update });
  await ensureUniqueSlug(db, Collections.benefits, update.slug!, slug);

  await db
    .collection<Benefit>(Collections.benefits)
    .updateOne({ slug }, { $set: update, $addToSet: { editedByAdmin: { $each: Object.keys(update) } } });

  await audit(db, actor(session), Collections.benefits, update.slug!, before as unknown as Record<string, unknown>, update as unknown as Record<string, unknown>);
  revalidateContent("benefits", update.slug);
  redirect("/admin/benefits");
}

export async function deleteBenefit(slug: string) {
  const session = await requireAdministrator();
  const db = await getDb();
  const before = await db.collection<Benefit>(Collections.benefits).findOne({ slug });
  await db.collection<Benefit>(Collections.benefits).deleteOne({ slug });
  if (before) await audit(db, actor(session), Collections.benefits, slug, before as unknown as Record<string, unknown>, null);
  revalidateContent("benefits", slug);
}

export async function toggleBenefitPublish(slug: string, current: boolean) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Benefit>(Collections.benefits).findOne({ slug });
  await db
    .collection<Benefit>(Collections.benefits)
    .updateOne({ slug }, { $set: { published: !current, updatedAt: new Date() } });
  if (before) await audit(db, actor(session), Collections.benefits, slug, before as unknown as Record<string, unknown>, { ...before, published: !current });
  revalidateContent("benefits", slug);
}

// ─── Tool actions ────────────────────────────────────────────────────────────

export async function createTool(data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const now = new Date();

  const doc: Tool = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    category: data.category as Tool["category"],
    officialLink: data.officialLink as string,
    image: (data.image as string) || undefined,
    free: data.free === true || data.free === "true",
    freeTier: data.freeTier as string | undefined,
    studentOffer: data.studentOffer === true || data.studentOffer === "true",
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    createdAt: now,
    updatedAt: now,
  };
  doc.editedByAdmin = Object.keys(doc).filter((field) => !["createdAt", "updatedAt", "editedByAdmin"].includes(field));

  ToolSchema.parse(doc); await ensureUniqueSlug(db, Collections.tools, doc.slug);

  await db.collection<Tool>(Collections.tools).insertOne(doc);
  await audit(db, actor(session), Collections.tools, doc.slug, null, doc as unknown as Record<string, unknown>); revalidateContent("tools", doc.slug);
  redirect("/admin/tools");
}

export async function updateTool(slug: string, data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Tool>(Collections.tools).findOne({ slug }); if (!before) throw new Error("Tool not found.");

  const update: Partial<Tool> = {
    title: data.title as string,
    slug: data.slug as string,
    description: data.description as string,
    category: data.category as Tool["category"],
    officialLink: data.officialLink as string,
    image: (data.image as string) || undefined,
    free: data.free === true || data.free === "true",
    freeTier: data.freeTier as string | undefined,
    studentOffer: data.studentOffer === true || data.studentOffer === "true",
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    updatedAt: new Date(),
  };

  ToolSchema.parse({ ...before, ...update }); await ensureUniqueSlug(db, Collections.tools, update.slug!, slug);

  await db
    .collection<Tool>(Collections.tools)
    .updateOne({ slug }, { $set: update, $addToSet: { editedByAdmin: { $each: Object.keys(update) } } });

  await audit(db, actor(session), Collections.tools, update.slug!, before as unknown as Record<string, unknown>, update as unknown as Record<string, unknown>); revalidateContent("tools", update.slug);
  redirect("/admin/tools");
}

export async function deleteTool(slug: string) {
  const session = await requireAdministrator();
  const db = await getDb();
  const before = await db.collection<Tool>(Collections.tools).findOne({ slug });
  await db.collection<Tool>(Collections.tools).deleteOne({ slug });
  if (before) await audit(db, actor(session), Collections.tools, slug, before as unknown as Record<string, unknown>, null);
  revalidateContent("tools", slug);
}

export async function toggleToolPublish(slug: string, current: boolean) {
  await setPublished("tools", slug, !current);
}

// ─── Guide actions ───────────────────────────────────────────────────────────

export async function createGuide(data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const now = new Date();

  const doc: Guide = {
    title: data.title as string,
    slug: data.slug as string,
    excerpt: data.excerpt as string,
    content: data.content as string,
    tags: (data.tags as string[]) ?? [],
    relatedBenefitSlug: (data.relatedBenefitSlug as string) || undefined,
    image: (data.image as string) || undefined,
    readingTimeMinutes: parseInt(data.readingTimeMinutes as string) || 5,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    createdAt: now,
    updatedAt: now,
  };
  doc.editedByAdmin = Object.keys(doc).filter((field) => !["createdAt", "updatedAt", "editedByAdmin"].includes(field));

  GuideSchema.parse(doc); await ensureUniqueSlug(db, Collections.guides, doc.slug);

  await db.collection<Guide>(Collections.guides).insertOne(doc);
  await audit(db, actor(session), Collections.guides, doc.slug, null, doc as unknown as Record<string, unknown>); revalidateContent("guides", doc.slug);
  redirect("/admin/guides");
}

export async function updateGuide(slug: string, data: Record<string, unknown>) {
  const session = await requireEditor();
  const db = await getDb();
  const before = await db.collection<Guide>(Collections.guides).findOne({ slug }); if (!before) throw new Error("Guide not found.");

  const update: Partial<Guide> = {
    title: data.title as string,
    slug: data.slug as string,
    excerpt: data.excerpt as string,
    content: data.content as string,
    tags: (data.tags as string[]) ?? [],
    relatedBenefitSlug: (data.relatedBenefitSlug as string) || undefined,
    image: (data.image as string) || undefined,
    readingTimeMinutes: parseInt(data.readingTimeMinutes as string) || 5,
    featured: data.featured === true || data.featured === "true",
    published: data.published === true || data.published === "true",
    updatedAt: new Date(),
  };

  GuideSchema.parse({ ...before, ...update }); await ensureUniqueSlug(db, Collections.guides, update.slug!, slug);

  await db
    .collection<Guide>(Collections.guides)
    .updateOne({ slug }, { $set: update, $addToSet: { editedByAdmin: { $each: Object.keys(update) } } });

  await audit(db, actor(session), Collections.guides, update.slug!, before as unknown as Record<string, unknown>, update as unknown as Record<string, unknown>); revalidateContent("guides", update.slug);
  redirect("/admin/guides");
}

export async function deleteGuide(slug: string) {
  const session = await requireAdministrator();
  const db = await getDb();
  const before = await db.collection<Guide>(Collections.guides).findOne({ slug });
  await db.collection<Guide>(Collections.guides).deleteOne({ slug });
  if (before) await audit(db, actor(session), Collections.guides, slug, before as unknown as Record<string, unknown>, null);
  revalidateContent("guides", slug);
}

export async function toggleGuidePublish(slug: string, current: boolean) {
  await setPublished("guides", slug, !current);
}

// ─── Report actions ──────────────────────────────────────────────────────────

export async function moderateReport(
  reportId: string,
  moderation: Report["moderation"],
  moderationReason?: string
) {
  const session = await requireEditor();
  const db = await getDb();
  if (!moderation) throw new Error("A moderation decision is required.");
  const before = await db.collection<Report>(Collections.reports).findOne({ _id: new ObjectId(reportId) });

  const update: Partial<Report> = {
    moderation,
    ...(moderationReason ? { moderationReason, adminNote: moderationReason } : {}),
  };

  await db
    .collection<Report>(Collections.reports)
    .updateOne({ _id: new ObjectId(reportId) }, { $set: { ...update, moderatedAt: new Date() } });

  if (before) await audit(db, actor(session), Collections.reports, reportId, before as unknown as Record<string, unknown>, update as unknown as Record<string, unknown>);
  revalidatePath("/admin/reports");
  revalidatePath("/reports");
  if (before?.benefitTitle) revalidatePath("/benefits");
}

// End of admin mutation actions.

const contentCollections = { opportunities: Collections.opportunities, benefits: Collections.benefits, tools: Collections.tools, guides: Collections.guides } as const;
export async function setPublished(kind: keyof typeof contentCollections, slug: string, published: boolean) {
  const session = await requireEditor(); const db = await getDb(); const collection = contentCollections[kind];
  const before = await db.collection(collection).findOne({ slug }); if (!before) throw new Error("Listing not found.");
  const after = { published, updatedAt: new Date() };
  await db.collection(collection).updateOne({ slug }, { $set: after });
  await audit(db, actor(session), collection, slug, before, { ...before, ...after }); revalidateContent(kind, slug);
}

export async function setPublishedFromForm(kind: keyof typeof contentCollections, slug: string, published: boolean, _formData: FormData) {
  void _formData;
  await setPublished(kind, slug, published);
}

export async function markVerified(kind: "opportunities" | "benefits", slug: string) {
  const session = await requireEditor(); const db = await getDb(); const collection = contentCollections[kind];
  const before = await db.collection(collection).findOne({ slug }); if (!before) throw new Error("Listing not found.");
  const now = new Date(); const verified = kind === "opportunities" ? { verifiedAt: now, verifiedBy: actor(session), source: { type: "official", url: before.officialLink }, confidence: "high", needsReview: false } : { lastChecked: now, verifiedBy: actor(session), confidence: "high", needsReview: false };
  await db.collection(collection).updateOne({ slug }, { $set: { ...verified, updatedAt: now } });
  await db.collection(Collections.needsAttention).updateMany({ sourceId: slug, resolved: { $ne: true } }, { $set: { resolved: true, resolvedAt: now, resolvedBy: actor(session) } });
  await audit(db, actor(session), collection, slug, before, { ...before, ...verified }); revalidateContent(kind, slug);
}

export async function resolveReview(id: string, decision: "approve" | "reject", reason = "") {
  const session = await requireEditor(); const db = await getDb(); const oid = new ObjectId(id);
  const row = await db.collection(Collections.reviewQueue).findOne({ _id: oid }); if (!row) throw new Error("Review item not found.");
  if (decision === "approve" && ["opportunities", "benefits", "tools", "guides"].includes(String(row.entityType))) {
    const kind = row.entityType as keyof typeof contentCollections; const collection = contentCollections[kind];
    const payload = row.payload as Record<string, unknown>; const targetSlug = typeof row.targetSlug === "string" ? row.targetSlug : undefined;
    if (targetSlug) {
      const before = await db.collection(collection).findOne({ slug: targetSlug });
      if (before) { const update = { ...payload, updatedAt: new Date(), needsReview: false }; await db.collection(collection).updateOne({ slug: targetSlug }, { $set: update }); await audit(db, actor(session), collection, String(payload.slug ?? targetSlug), before, { ...before, ...update }); revalidateContent(kind, String(payload.slug ?? targetSlug)); }
    } else {
      await ensureUniqueSlug(db, collection, String(payload.slug ?? ""));
      const draft = { ...payload, published: false, createdAt: new Date(), updatedAt: new Date(), needsReview: false };
      const inserted = await db.collection(collection).insertOne(draft); void inserted;
      await audit(db, actor(session), collection, String(payload.slug), null, draft); revalidateContent(kind, String(payload.slug));
    }
  }
  await db.collection(Collections.reviewQueue).updateOne({ _id: oid, status: "pending" }, { $set: { status: decision === "approve" ? "approved" : "rejected", reason, reviewedAt: new Date(), reviewedBy: actor(session) } });
  await audit(db, actor(session), Collections.reviewQueue, id, row, { status: decision, reason }); revalidatePath("/admin/review");
}

export async function bulkResolveReview(ids: string[], decision: "approve" | "reject", reason = "") {
  if (ids.length > 100) throw new Error("Select at most 100 items.");
  await requireEditor();
  for (const id of ids.filter(ObjectId.isValid)) await resolveReview(id, decision, reason);
}

export async function deleteReport(reportId: string) {
  const session = await requireAdministrator();
  const db = await getDb();
  const before = await db.collection<Report>(Collections.reports).findOne({ _id: new ObjectId(reportId) });
  await db
    .collection<Report>(Collections.reports)
    .deleteOne({ _id: new ObjectId(reportId) });
  if (before) await audit(db, actor(session), Collections.reports, reportId, before as unknown as Record<string, unknown>, null);
  revalidatePath("/admin/reports");
}

