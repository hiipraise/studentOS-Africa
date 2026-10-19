import Link from "next/link";
import { Edit, Eye, Trash2 } from "lucide-react";
import { setPublishedFromForm } from "./actions";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export function AdminTable<T extends { _id?: unknown; slug?: string }>({
  columns,
  data,
  basePath,
  emptyMessage = "No items found.",
}: {
  columns: Column<T>[];
  data: T[];
  basePath: string;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
        <Link
          href={`${basePath}/new`}
          className="btn-primary inline-flex mt-4 text-sm"
        >
          Create the first one
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, i) => (
              <tr key={item.slug ?? i} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-ink ${col.className ?? ""}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`${basePath}/${item.slug}/edit`}
                      className="p-1.5 rounded-md text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    {(["opportunities", "benefits", "tools", "guides"].includes(basePath.split("/").pop() ?? "") && "published" in (item as object)) && <form action={setPublishedFromForm.bind(null, basePath.split("/").pop() as "opportunities" | "benefits" | "tools" | "guides", item.slug!, !((item as unknown as {published:boolean}).published))}><button className="rounded px-2 py-1 text-xs border">{(item as unknown as {published:boolean}).published ? "Unpublish" : "Publish"}</button></form>}
                    {item.slug && <Link href={`/admin/audit/${basePath.split("/").pop()}/${item.slug}`} className="px-2 py-1 text-xs text-muted hover:text-ink" title="Audit history">Audit</Link>}
                    <Link
                      href={`/${basePath.replace("/admin/", "")}/${item.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-gray-100 transition-colors"
                      title="View on site"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-muted"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function DeleteButton({
  action,
  slug,
}: {
  action: string;
  slug: string;
}) {
  return (
    <form action={action} method="POST">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="p-1.5 rounded-md text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Delete"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this item?")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
