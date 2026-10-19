import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { getDb, Collections } from "@/lib/db";
import type { Opportunity } from "@/types";
import OpportunityForm from "./Form";

export const dynamic = "force-dynamic";
export default async function EditOpportunityRoute({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const db = await getDb();
  const opportunity = await db.collection<Opportunity>(Collections.opportunities).findOne({ slug });
  if (!opportunity) notFound();
  return <OpportunityForm opportunity={opportunity as unknown as Opportunity} slug={slug} />;
}
