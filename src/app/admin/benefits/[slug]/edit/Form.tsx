"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Checkbox, ArrayInput } from "../../../AdminForm";
import { updateBenefit } from "../../../actions";
import type { Benefit } from "@/types";

interface Props {
  benefit: Benefit;
  slug: string;
}

export default function EditBenefitPage({ benefit, slug }: Props) {
  const [title, setTitle] = useState(benefit.title);
  const [formSlug, setFormSlug] = useState(benefit.slug);
  const [description, setDescription] = useState(benefit.description);
  const [eligibility, setEligibility] = useState(benefit.eligibility);
  const [requirements, setRequirements] = useState(benefit.requirements ?? []);
  const [officialLink, setOfficialLink] = useState(benefit.officialLink);
  const [guideLink, setGuideLink] = useState(benefit.guideLink ?? "");
  const [featured, setFeatured] = useState(benefit.featured);
  const [published, setPublished] = useState(benefit.published);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await updateBenefit(slug, {
      title, slug: formSlug, description, eligibility, requirements,
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
      <h1 className="text-2xl font-bold text-ink mb-6">Edit Benefit</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <TextInput label="Title" name="title" value={title} onChange={setTitle} required />
        <SlugInput value={formSlug} onChange={setFormSlug} />
        <TextInput label="Description" name="description" value={description} onChange={setDescription} multiline rows={4} required />
        <TextInput label="Eligibility" name="eligibility" value={eligibility} onChange={setEligibility} multiline rows={2} required />
        <ArrayInput label="Requirements" name="requirements" values={requirements} onChange={setRequirements} />
        <TextInput label="Official Link" name="officialLink" value={officialLink} onChange={setOfficialLink} required />
        <TextInput label="Guide Link (optional)" name="guideLink" value={guideLink} onChange={setGuideLink} />
        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/benefits" className="btn-ghost text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
