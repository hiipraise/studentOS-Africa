"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/lib/domain/countries";

const LEVELS = ["undergraduate", "postgraduate", "phd", "professional"] as const;

interface AccountClientProps {
  email: string;
  name?: string;
  country?: string;
  level?: string;
  fields?: string[];
}

export function AccountClient({ email, name = "", country = "", level = "undergraduate", fields = [] }: AccountClientProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name, country, level, fields: fields.join(", ") });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          level: form.level,
          fields: form.fields.split(",").map((field) => field.trim()).filter(Boolean),
        }),
      });
      setMessage(response.ok ? "Profile saved." : "Could not save your profile.");
      if (response.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount() {
    setDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok) await signOut({ callbackUrl: "/" });
      else setMessage("Could not delete the account. Please contact us.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card-base flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Your profile</h2>
        <p className="text-xs text-muted">Signed in as {email}</p>
        <label className="text-sm font-medium text-ink">Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-ink">Country
            <select value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="">Prefer not to say</option>
              {AFRICAN_COUNTRIES.map(([code, label]) => <option key={code} value={label}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-ink">Level
            <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
              {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="text-sm font-medium text-ink">Fields of interest
          <input value={form.fields} onChange={(event) => setForm({ ...form, fields: event.target.value })} placeholder="Computer Science, Data Science" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </label>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
          </button>
          {message && <span className="text-xs text-muted">{message}</span>}
        </div>
      </section>

      <section className="card-base flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Your data</h2>
        <p className="text-sm text-muted">Download a JSON copy of your profile, saved items and newsletter consent. You can delete everything at any time.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/account/export" className="btn-ghost border border-border rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2">
            <Download className="h-4 w-4" aria-hidden="true" /> Export my data
          </a>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost border border-rose-200 text-rose-600 rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete my account
            </button>
          ) : (
            <span className="flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              This removes your account and saves permanently.
              <button onClick={removeAccount} disabled={deleting} className="font-semibold underline">{deleting ? "Deleting…" : "Yes, delete"}</button>
              <button onClick={() => setConfirmDelete(false)} className="underline">Cancel</button>
            </span>
          )}
        </div>
      </section>

      <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-muted underline self-start">Sign out</button>
    </div>
  );
}
