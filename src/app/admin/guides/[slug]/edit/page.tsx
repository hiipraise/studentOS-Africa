import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { getDb, Collections } from "@/lib/db";
import type { Guide } from "@/types";
import EditGuideForm from "./Form";

export const dynamic = "force-dynamic";
export default async function EditGuideRoute({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const db = await getDb();
  const guide = await db.collection<Guide>(Collections.guides).findOne({ slug });
  if (!guide) notFound();
  return <EditGuideForm guide={guide as unknown as Guide} slug={slug} />;
}
