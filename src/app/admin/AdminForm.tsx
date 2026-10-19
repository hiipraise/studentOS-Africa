"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { slugify } from "@/lib/utils";

// ─── Field types ─────────────────────────────────────────────────────────────

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function Field({
  label,
  name,
  error,
  required,
  children,
  className,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required,
  multiline,
  rows = 3,
  autoSlug,
  slugTarget,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  autoSlug?: boolean;
  slugTarget?: (slug: string) => void;
}) {
  const id = `field-${name}`;

  function handleChange(val: string) {
    onChange(val);
    if (autoSlug && slugTarget) {
      slugTarget(slugify(val));
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all";

  return (
    <Field label={label} name={id} error={error} required={required}>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClass} resize-y min-h-[80px]`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </Field>
  );
}

export function SlugInput({
  label = "Slug",
  name = "slug",
  value,
  onChange,
  error,
  required = true,
}: {
  label?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} name={`field-${name}`} error={error} required={required}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
          /
        </span>
        <input
          id={`field-${name}`}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(slugify(e.target.value))}
          placeholder="my-url-slug"
          className="w-full rounded-lg border border-gray-200 bg-white pl-7 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all font-mono"
        />
      </div>
    </Field>
  );
}

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  const id = `field-${name}`;

  return (
    <Field label={label} name={id} error={error} required={required}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  const id = `field-${name}`;

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-forest focus:ring-forest focus:ring-offset-0"
      />
      <span className="text-sm text-ink group-hover:text-ink/80 transition-colors">
        {label}
      </span>
    </label>
  );
}

export function ArrayInput({
  label,
  name,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [newValue, setNewValue] = useState("");
  const id = `field-${name}`;

  function add() {
    if (newValue.trim()) {
      onChange([...values, newValue.trim()]);
      setNewValue("");
    }
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          name={name}
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? `Add a ${label.toLowerCase()}…`}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-all"
        />
        <button
          type="button"
          onClick={add}
          disabled={!newValue.trim()}
          className="rounded-lg border border-gray-200 px-3 py-2 text-muted hover:text-ink hover:border-forest/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-ink"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Form actions ────────────────────────────────────────────────────────────

export function FormActions({
  slug,
  isEditing,
}: {
  slug?: string;
  isEditing: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
      <button type="submit" className="btn-primary text-sm">
        {isEditing ? "Save changes" : "Create"}
      </button>
      <a
        href={slug ? `/${slug.split("/").slice(0, -2).join("/")}` : "."}
        className="btn-ghost text-sm"
      >
        Cancel
      </a>
    </div>
  );
}
