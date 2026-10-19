import { getDb, Collections } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminTable, StatusBadge } from "../AdminTable";
import type { Benefit } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBenefitsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const items = await db
    .collection<Benefit>(Collections.benefits)
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-ink">Benefits</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage student benefits, discounts, and perks.
          </p>
        </div>
        <Link href="/admin/benefits/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          New Benefit
        </Link>
      </div>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item: Benefit) => (
              <span className="font-medium text-ink">{item.title}</span>
            ),
          },
          {
            key: "eligibility",
            header: "Eligibility",
            render: (item: Benefit) => (
              <span className="text-muted text-xs truncate max-w-[200px] inline-block">
                {item.eligibility}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: Benefit) => <StatusBadge published={item.published} />,
          },
        ]}
        data={items as unknown as Benefit[]}
        basePath="/admin/benefits"
        emptyMessage="No benefits yet."
      />
    </div>
  );
}
