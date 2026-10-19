import { getDb, Collections } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Download } from "lucide-react";
import type { NewsletterSubscriber } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const subscribers = await db
    .collection<NewsletterSubscriber>(Collections.newsletter)
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  const total = subscribers.length;
  const today = new Date().toISOString().split("T")[0];
  const todaySubscribers = subscribers.filter(
    (s) => new Date(s.createdAt).toISOString().split("T")[0] === today
  ).length;

  // CSV export
  const csvContent = "email,subscribed_at\n" + subscribers
    .map((s) => `${s.email},${new Date(s.createdAt).toISOString()}`)
    .join("\n");

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-6">Newsletter Subscribers</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-2xl font-bold text-ink tabular-nums">{total}</p>
          <p className="text-sm text-muted mt-0.5">Total subscribers</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-2xl font-bold text-ink tabular-nums">{todaySubscribers}</p>
          <p className="text-sm text-muted mt-0.5">Subscribed today</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Export</p>
            <p className="text-xs text-muted/60 mt-0.5">Download all emails as CSV</p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
            download={`newsletter-subscribers-${today}.csv`}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
        </div>
      </div>

      {/* Subscriber table */}
      {subscribers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Mail className="h-8 w-8 text-muted/40 mx-auto mb-3" />
          <p className="text-sm text-muted">No subscribers yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subscribed at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((sub) => (
                  <tr key={sub._id?.toString()} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-ink font-medium">{sub.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
