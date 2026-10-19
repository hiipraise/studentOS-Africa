import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { GuideContent } from "@/components/guides/GuideContent";
import { getGuideBySlug } from "@/lib/data/guides";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.excerpt,
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      images: guide.image ? [{ url: guide.image }] : undefined,
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) notFound();

  const { title, excerpt, content, tags, image, readingTimeMinutes } = guide;

  return (
    <div className="container-site py-10 md:py-14">
      <Link
        href="/guides"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Guides
      </Link>

      <article className="mx-auto max-w-prose flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">
            {title}
          </h1>
          <p className="text-muted leading-relaxed">{excerpt}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {readingTimeMinutes} min read
          </div>
        </div>

        {/* Hero image */}
        {image && (
          <div className="relative h-56 md:h-80 w-full overflow-hidden rounded-2xl bg-sage">
            <Image src={image} alt={title} fill className="object-cover" priority />
          </div>
        )}

        {/* Body */}
        <GuideContent content={content} />
      </article>
    </div>
  );
}
