import { getDb, Collections } from "@/lib/db";
import { requireEditor } from "@/lib/authz";
import Link from "next/link";
import {
  GraduationCap,
  Gift,
  Wrench,
  BookOpen,
  Flag,
  Mail,
  ArrowUpRight,
  Plus,
} from "lucide-react";

interface CollectionCount {
  label: string;
  slug: string;
  icon: typeof GraduationCap;
  href: string;
  color: string;
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireEditor();

  const db = await getDb();

  const sevenDays = new Date(Date.now() + 7 * 86400000);
  const staleDate = new Date(Date.now() - 45 * 86400000);
  const [opportunityCount, benefitCount, toolCount, guideCount, reportCount, subscriberCount, attentionCount, drafts, brokenLinks, closingSoon, staleListings] =
    await Promise.all([
      db.collection(Collections.opportunities).countDocuments(),
      db.collection(Collections.benefits).countDocuments(),
      db.collection(Collections.tools).countDocuments(),
      db.collection(Collections.guides).countDocuments(),
      db.collection(Collections.reports).countDocuments({ status: "pending" }),
      db.collection(Collections.newsletter).countDocuments(),
      db.collection(Collections.needsAttention).countDocuments({ resolved: { $ne: true }, kind: /outdated|report/i }),
      Promise.all([Collections.opportunities, Collections.benefits, Collections.tools, Collections.guides].map((name) => db.collection(name).countDocuments({ published: false }))).then((counts) => counts.reduce((sum, n) => sum + n, 0)),
      db.collection(Collections.opportunities).countDocuments({ $or: [{ "lastLinkCheck.status": { $in: ["broken", "error", "unreachable"] } }, { "lastLinkCheck.httpCode": { $gte: 400 } }] }),
      db.collection(Collections.opportunities).countDocuments({ published: true, $or: [{ deadline: { $gte: new Date(), $lte: sevenDays } }, { "cycle.closesAt": { $gte: new Date(), $lte: sevenDays } }] }),
      Promise.all([
        db.collection(Collections.opportunities).countDocuments({ published: true, $or: [{ verifiedAt: { $lt: staleDate } }, { verifiedAt: { $exists: false } }] }),
        db.collection(Collections.benefits).countDocuments({ published: true, $or: [{ lastChecked: { $lt: staleDate } }, { lastChecked: { $exists: false } }] }),
      ]).then((counts) => counts.reduce((sum, n) => sum + n, 0)),
    ]);

  const cards: CollectionCount[] = [
    {
      label: "Opportunities",
      slug: "opportunities",
      icon: GraduationCap,
      href: "/admin/opportunities",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Benefits",
      slug: "benefits",
      icon: Gift,
      href: "/admin/benefits",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Tools",
      slug: "tools",
      icon: Wrench,
      href: "/admin/tools",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Guides",
      slug: "guides",
      icon: BookOpen,
      href: "/admin/guides",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Reports",
      slug: "reports",
      icon: Flag,
      href: "/admin/reports",
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "Subscribers",
      slug: "newsletter",
      icon: Mail,
      href: "/admin/newsletter",
      color: "text-cyan-600 bg-cyan-50",
    },
  ];

  const counts: Record<string, number> = {
    opportunities: opportunityCount,
    benefits: benefitCount,
    tools: toolCount,
    guides: guideCount,
    reports: reportCount,
    newsletter: subscriberCount,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            Welcome back. Here&apos;s an overview of StudentOS Africa.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, slug, icon: Icon, href, color }) => (
          <Link
            key={slug}
            href={href}
            className="rounded-xl border border-gray-200 bg-white p-5 hover:border-forest/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-ink transition-colors" />
            </div>
            <p className="text-2xl font-bold text-ink mt-4 tabular-nums">
              {counts[slug]}
            </p>
            <p className="text-sm text-muted mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-ink mt-10 mb-4">Review and operations</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Drafts awaiting review", drafts, "/admin/review"], ["Reports to moderate", reportCount, "/admin/reports"],
          ["Outdated flags", attentionCount, "/admin/needs-attention"], ["Broken links", brokenLinks, "/admin/needs-attention"],
          ["Closing in 7 days", closingSoon, "/admin/opportunities"], ["Not verified in 45 days", staleListings, "/admin/verification"],
          ["Newsletter subscribers", subscriberCount, "/admin/newsletter"],
        ].map(([label, count, href]) => <Link key={String(label)} href={String(href)} className="rounded-xl border bg-white p-4 hover:border-forest/30"><strong className="block text-2xl">{count}</strong><span className="text-sm text-muted">{label}</span></Link>)}
      </div>

      {/* Quick actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction href="/admin/opportunities/new" icon={Plus}>
            New Opportunity
          </QuickAction>
          <QuickAction href="/admin/benefits/new" icon={Plus}>
            New Benefit
          </QuickAction>
          <QuickAction href="/admin/tools/new" icon={Plus}>
            New Tool
          </QuickAction>
          <QuickAction href="/admin/guides/new" icon={Plus}>
            New Guide
          </QuickAction>
          <QuickAction href="/admin/needs-attention" icon={Flag} urgent={attentionCount > 0}>
            Needs attention ({attentionCount})
          </QuickAction>
          <QuickAction href="/admin/review" icon={Flag}>Review queue ({drafts})</QuickAction>
          <QuickAction href="/admin/verification" icon={Flag}>Verification</QuickAction>
          {reportCount > 0 && (
            <QuickAction href="/admin/reports" icon={Flag} urgent>
              {reportCount} pending {reportCount === 1 ? "report" : "reports"}
            </QuickAction>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  urgent,
  children,
}: {
  href: string;
  icon: typeof Plus;
  urgent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
        urgent
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-gray-200 bg-white text-ink hover:border-forest/30 hover:bg-sage/30"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
