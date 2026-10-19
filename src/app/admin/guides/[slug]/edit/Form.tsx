"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Checkbox, ArrayInput } from "../../../AdminForm";
import { updateGuide } from "../../../actions";
import type { Guide } from "@/types";

interface Props {
  guide: Guide;
  slug: string;
}

export default function EditGuidePage({ guide, slug }: Props) {
  const [title, setTitle] = useState(guide.title);
  const [formSlug, setFormSlug] = useState(guide.slug);
  const [excerpt, setExcerpt] = useState(guide.excerpt);
  const [content, setContent] = useState(guide.content);
  const [tags, setTags] = useState(guide.tags ?? []);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(String(guide.readingTimeMinutes));
  const [relatedBenefitSlug, setRelatedBenefitSlug] = useState(guide.relatedBenefitSlug ?? "");
  const [featured, setFeatured] = useState(guide.featured);
  const [published, setPublished] = useState(guide.published);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await updateGuide(slug, {
      title, slug: formSlug, excerpt, content, tags,
      readingTimeMinutes: parseInt(readingTimeMinutes) || 5,
      relatedBenefitSlug: relatedBenefitSlug || undefined,
      featured, published,
    });
  }

  return (
    <div>
      <Link href="/admin/guides" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Guides
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-6">Edit Guide</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <TextInput label="Title" name="title" value={title} onChange={setTitle} required />
        <SlugInput value={formSlug} onChange={setFormSlug} />
        <TextInput label="Excerpt" name="excerpt" value={excerpt} onChange={setExcerpt} multiline rows={2} required />
        <TextInput label="Content (Markdown)" name="content" value={content} onChange={setContent} multiline rows={10} required />
        <ArrayInput label="Tags" name="tags" values={tags} onChange={setTags} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput label="Reading time (minutes)" name="readingTimeMinutes" value={readingTimeMinutes} onChange={setReadingTimeMinutes} />
          <TextInput label="Related benefit slug" name="relatedBenefitSlug" value={relatedBenefitSlug} onChange={setRelatedBenefitSlug} />
        </div>
        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/guides" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
