import { getDb, Collections } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminTable, StatusBadge } from "../AdminTable";
import type { Guide } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const items = await db
    .collection<Guide>(Collections.guides)
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
          <h1 className="text-2xl font-bold text-ink">Guides</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage guides and tutorials for students.
          </p>
        </div>
        <Link href="/admin/guides/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          New Guide
        </Link>
      </div>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item: Guide) => (
              <span className="font-medium text-ink">{item.title}</span>
            ),
          },
          {
            key: "readingTime",
            header: "Read time",
            render: (item: Guide) => (
              <span className="text-muted text-xs">{item.readingTimeMinutes} min</span>
            ),
          },
          {
            key: "tags",
            header: "Tags",
            render: (item: Guide) => (
              <div className="flex gap-1 flex-wrap">
                {(item.tags ?? []).slice(0, 3).map((tag) => (
                  <span key={tag} className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: Guide) => <StatusBadge published={item.published} />,
          },
        ]}
        data={items as unknown as Guide[]}
        basePath="/admin/guides"
        emptyMessage="No guides yet."
      />
    </div>
  );
}
