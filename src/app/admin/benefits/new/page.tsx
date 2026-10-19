"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Checkbox, ArrayInput } from "../../AdminForm";
import { createBenefit } from "../../actions";

export default function NewBenefitPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [officialLink, setOfficialLink] = useState("");
  const [guideLink, setGuideLink] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await createBenefit({
      title, slug, description, eligibility, requirements,
      officialLink, guideLink: guideLink || undefined,
      featured, published,
    });
  }

  return (
    <div>
      <Link href="/admin/benefits" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Benefits
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-6">New Benefit</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <TextInput label="Title" name="title" value={title} onChange={setTitle} autoSlug slugTarget={setSlug} placeholder="GitHub Student Developer Pack" required />
        <SlugInput value={slug} onChange={setSlug} />
        <TextInput label="Description" name="description" value={description} onChange={setDescription} multiline rows={4} placeholder="Describe this benefit..." required />
        <TextInput label="Eligibility" name="eligibility" value={eligibility} onChange={setEligibility} multiline rows={2} placeholder="Who is eligible?" required />
        <ArrayInput label="Requirements" name="requirements" values={requirements} onChange={setRequirements} placeholder="Add a requirement..." />
        <TextInput label="Official Link" name="officialLink" value={officialLink} onChange={setOfficialLink} placeholder="https://..." required />
        <TextInput label="Guide Link (optional)" name="guideLink" value={guideLink} onChange={setGuideLink} placeholder="https://..." />
        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? "Saving…" : "Create benefit"}
          </button>
          <Link href="/admin/benefits" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
