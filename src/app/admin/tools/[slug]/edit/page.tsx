import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { getDb, Collections } from "@/lib/db";
import type { Tool } from "@/types";
import EditToolForm from "./Form";

export const dynamic = "force-dynamic";
export default async function EditToolRoute({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const db = await getDb();
  const tool = await db.collection<Tool>(Collections.tools).findOne({ slug });
  if (!tool) notFound();
  return <EditToolForm tool={tool as unknown as Tool} slug={slug} />;
}
