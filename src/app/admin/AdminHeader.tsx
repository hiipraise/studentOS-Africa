"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-end px-6 lg:px-8 gap-4 shrink-0">
      {session?.user && (
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-muted hidden sm:inline">
            {session.user.email}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 text-forest">
            <User className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      )}
    </header>
  );
}
