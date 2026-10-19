import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { getDb, Collections } from "@/lib/db";
import type { Benefit } from "@/types";
import EditBenefitForm from "./Form";

export const dynamic = "force-dynamic";
export default async function EditBenefitRoute({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const db = await getDb();
  const benefit = await db.collection<Benefit>(Collections.benefits).findOne({ slug });
  if (!benefit) notFound();
  return <EditBenefitForm benefit={benefit as unknown as Benefit} slug={slug} />;
}
