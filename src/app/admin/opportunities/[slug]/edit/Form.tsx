"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextInput, SlugInput, Select, Checkbox, ArrayInput } from "../../../AdminForm";
import { createOpportunity, updateOpportunity } from "../../../actions";
import type { Opportunity } from "@/types";
import { ImageUpload } from "@/components/shared/ImageUpload";

const CATEGORIES = [
  { value: "Scholarship", label: "Scholarship" },
  { value: "Internship", label: "Internship" },
  { value: "Fellowship", label: "Fellowship" },
  { value: "Competition", label: "Competition" },
  { value: "Hackathon", label: "Hackathon" },
  { value: "Grant", label: "Grant" },
  { value: "Program", label: "Program" },
];

interface Props {
  opportunity?: Opportunity | null;
  slug?: string;
}

export default function OpportunityForm({ opportunity, slug }: Props) {
  const isEditing = !!opportunity;

  const [title, setTitle] = useState(opportunity?.title ?? "");
  const [formSlug, setFormSlug] = useState(opportunity?.slug ?? "");
  const [description, setDescription] = useState(opportunity?.description ?? "");
  const [category, setCategory] = useState<string>(opportunity?.category ?? "Scholarship");
  const [countries, setCountries] = useState(opportunity?.countries ?? []);
  const [deadline, setDeadline] = useState(
    opportunity?.deadline
      ? new Date(opportunity.deadline).toISOString().split("T")[0]
      : ""
  );
  const [requirements, setRequirements] = useState(opportunity?.requirements ?? []);
  const [benefits, setBenefits] = useState(opportunity?.benefits ?? []);
  const [applicationSteps, setApplicationSteps] = useState(opportunity?.applicationSteps ?? []);
  const [officialLink, setOfficialLink] = useState(opportunity?.officialLink ?? "");
  const [image, setImage] = useState(opportunity?.image ?? "");
  const [featured, setFeatured] = useState(opportunity?.featured ?? false);
  const [published, setPublished] = useState(opportunity?.published ?? false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      title,
      slug: formSlug,
      description,
      category,
      countries,
      deadline: deadline || null,
      requirements,
      benefits,
      applicationSteps,
      officialLink,
      image: image || undefined,
      featured,
      published,
    };

    if (isEditing && slug) {
      await updateOpportunity(slug, data);
    } else {
      await createOpportunity(data);
    }
  }

  return (
    <div>
      <Link
        href="/admin/opportunities"
        className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Opportunities
      </Link>

      <h1 className="text-2xl font-bold text-ink mb-6">
        {isEditing ? "Edit Opportunity" : "New Opportunity"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        <TextInput
          label="Title"
          name="title"
          value={title}
          onChange={setTitle}
          autoSlug
          slugTarget={isEditing ? undefined : setFormSlug}
          placeholder="Mastercard Foundation Scholars Program"
          required
        />

        <SlugInput value={formSlug} onChange={setFormSlug} />

        <TextInput
          label="Description"
          name="description"
          value={description}
          onChange={setDescription}
          multiline
          rows={4}
          placeholder="A comprehensive description of this opportunity..."
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            name="category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
            required
          />

          <TextInput
            label="Deadline (optional)"
            name="deadline"
            value={deadline}
            onChange={setDeadline}
            placeholder="2026-12-31 (leave blank for rolling)"
          />
        </div>

        <ArrayInput
          label="Countries"
          name="countries"
          values={countries}
          onChange={setCountries}
          placeholder="e.g. Nigeria, Kenya, Ghana"
        />

        <TextInput
          label="Official Link"
          name="officialLink"
          value={officialLink}
          onChange={setOfficialLink}
          placeholder="https://..."
          required
        />

        <div><label className="mb-2 block text-sm font-medium">Listing image</label><ImageUpload folder="opportunities" initialUrl={image || undefined} onUploadComplete={setImage} /></div>

        <ArrayInput
          label="Requirements"
          name="requirements"
          values={requirements}
          onChange={setRequirements}
          placeholder="Add a requirement..."
        />

        <ArrayInput
          label="Benefits"
          name="benefits"
          values={benefits}
          onChange={setBenefits}
          placeholder="What does the recipient get?"
        />

        <ArrayInput
          label="Application Steps"
          name="applicationSteps"
          values={applicationSteps}
          onChange={setApplicationSteps}
          placeholder="Add a step..."
        />

        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Featured" name="featured" checked={featured} onChange={setFeatured} />
          <Checkbox label="Published" name="published" checked={published} onChange={setPublished} />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isEditing
              ? "Save changes"
              : "Create opportunity"}
          </button>
          <Link
            href="/admin/opportunities"
            className="btn-ghost text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
