"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  Gift,
  Wrench,
  BookOpen,
  Flag,
  Mail,
  ClipboardList,
  BadgeCheck,
  LogOut,
  ExternalLink,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/opportunities", label: "Opportunities", icon: GraduationCap },
  { href: "/admin/benefits", label: "Benefits", icon: Gift },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/guides", label: "Guides", icon: BookOpen },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/review", label: "Review queue", icon: ClipboardList },
  { href: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <button
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setCollapsed(true)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-30 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"
        )}
      >
        {/* Logo area */}
        <div className={cn(
          "flex items-center h-16 border-b border-gray-200 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-white text-xs font-bold">
                S
              </span>
              <span className="text-sm font-bold text-ink">
                Admin
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-gray-100 transition-colors hidden lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-forest/10 text-forest"
                    : "text-muted hover:text-ink hover:bg-gray-100"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-gray-200 p-2 space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-gray-100 transition-colors",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "View site" : undefined}
          >
            <ExternalLink className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>View site</span>}
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-red-600 hover:bg-red-50 transition-colors",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-30 lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}
