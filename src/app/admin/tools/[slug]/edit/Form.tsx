"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Select, Checkbox } from "../../../AdminForm";
import { updateTool } from "../../../actions";
import type { Tool } from "@/types";

const CATEGORIES = [
  { value: "AI", label: "AI" },
  { value: "Coding", label: "Coding" },
  { value: "Design", label: "Design" },
  { value: "Research", label: "Research" },
  { value: "Productivity", label: "Productivity" },
  { value: "Learning", label: "Learning" },
];

interface Props {
  tool: Tool;
  slug: string;
}

export default function EditToolPage({ tool, slug }: Props) {
  const [title, setTitle] = useState(tool.title);
  const [formSlug, setFormSlug] = useState(tool.slug);
  const [description, setDescription] = useState(tool.description);
  const [category, setCategory] = useState<string>(tool.category);
  const [officialLink, setOfficialLink] = useState(tool.officialLink);
  const [free, setFree] = useState(tool.free);
  const [featured, setFeatured] = useState(tool.featured);
  const [published, setPublished] = useState(tool.published);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await updateTool(slug, { title, slug: formSlug, description, category, officialLink, free, featured, published });
  }

  return (
    <div>
      <Link href="/admin/tools" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tools
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-6">Edit Tool</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <TextInput label="Title" name="title" value={title} onChange={setTitle} required />
        <SlugInput value={formSlug} onChange={setFormSlug} />
        <TextInput label="Description" name="description" value={description} onChange={setDescription} multiline rows={3} required />
        <Select label="Category" name="category" value={category} onChange={setCategory} options={CATEGORIES} required />
        <TextInput label="Official Link" name="officialLink" value={officialLink} onChange={setOfficialLink} required />
        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Free" name="free" checked={free} onChange={setFree} />
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/tools" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
