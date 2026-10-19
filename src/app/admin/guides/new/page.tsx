"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Checkbox, ArrayInput } from "../../AdminForm";
import { createGuide } from "../../actions";
import ReactMarkdown from "react-markdown";

export default function NewGuidePage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState("5");
  const [relatedBenefitSlug, setRelatedBenefitSlug] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await createGuide({
      title, slug, excerpt, content, tags,
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
      <h1 className="text-2xl font-bold text-ink mb-6">New Guide</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <TextInput label="Title" name="title" value={title} onChange={setTitle} autoSlug slugTarget={setSlug} placeholder="How to Apply for the Mastercard Foundation Scholarship" required />
        <SlugInput value={slug} onChange={setSlug} />
        <TextInput label="Excerpt" name="excerpt" value={excerpt} onChange={setExcerpt} multiline rows={2} placeholder="Short summary shown in cards..." required />
        <div><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">Content (Markdown)</span><button type="button" className="text-sm text-forest underline" onClick={() => setPreview(!preview)}>{preview ? "Edit markdown" : "Preview"}</button></div>{preview ? <div className="prose min-h-48 max-w-none rounded border p-4"><ReactMarkdown>{content}</ReactMarkdown></div> : <TextInput label="" name="content" value={content} onChange={setContent} multiline rows={10} placeholder="Full guide content in markdown..." required />}</div>
        <ArrayInput label="Tags" name="tags" values={tags} onChange={setTags} placeholder="Add a tag..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput label="Reading time (minutes)" name="readingTimeMinutes" value={readingTimeMinutes} onChange={setReadingTimeMinutes} placeholder="5" />
          <TextInput label="Related benefit slug (optional)" name="relatedBenefitSlug" value={relatedBenefitSlug} onChange={setRelatedBenefitSlug} placeholder="github-student-pack" />
        </div>
        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? "Saving…" : "Create guide"}
          </button>
          <Link href="/admin/guides" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
