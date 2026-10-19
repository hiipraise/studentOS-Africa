import { getDb, Collections } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminTable, StatusBadge } from "../AdminTable";
import type { Tool } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const items = await db
    .collection<Tool>(Collections.tools)
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
          <h1 className="text-2xl font-bold text-ink">Tools</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage free tools and software for students.
          </p>
        </div>
        <Link href="/admin/tools/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          New Tool
        </Link>
      </div>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item: Tool) => (
              <span className="font-medium text-ink">{item.title}</span>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (item: Tool) => (
              <span className="text-muted">{item.category}</span>
            ),
          },
          {
            key: "free",
            header: "Free",
            render: (item: Tool) => (
              <span className={item.free ? "text-emerald-600" : "text-muted"}>
                {item.free ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: Tool) => <StatusBadge published={item.published} />,
          },
        ]}
        data={items as unknown as Tool[]}
        basePath="/admin/tools"
        emptyMessage="No tools yet."
      />
    </div>
  );
}
