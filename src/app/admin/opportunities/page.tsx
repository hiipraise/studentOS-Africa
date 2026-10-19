import { getDb, Collections } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminTable, StatusBadge } from "../AdminTable";
import type { Opportunity } from "@/types";
import { formatDeadline } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOpportunitiesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const items = await db
    .collection<Opportunity>(Collections.opportunities)
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
          <h1 className="text-2xl font-bold text-ink">Opportunities</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage scholarships, internships, fellowships, and more.
          </p>
        </div>
        <Link
          href="/admin/opportunities/new"
          className="btn-primary text-sm"
        >
          <Plus className="h-4 w-4" />
          New Opportunity
        </Link>
      </div>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item: Opportunity) => (
              <span className="font-medium text-ink">{item.title}</span>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (item: Opportunity) => (
              <span className="text-muted">{item.category}</span>
            ),
          },
          {
            key: "deadline",
            header: "Deadline",
            render: (item: Opportunity) => (
              <span className="text-muted text-xs">
                {formatDeadline(item.deadline)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: Opportunity) => <StatusBadge published={item.published} />,
          },
        ]}
        data={items as unknown as Opportunity[]}
        basePath="/admin/opportunities"
        emptyMessage="No opportunities yet."
      />
    </div>
  );
}
