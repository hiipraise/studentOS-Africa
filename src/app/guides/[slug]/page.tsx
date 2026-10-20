import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { GuideContent } from "@/components/guides/GuideContent";
import { getGuideBySlug, getPublishedGuideSlugs } from "@/lib/data/guides";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function absolute(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
}

export async function generateStaticParams() {
  try {
    const guides = await getPublishedGuideSlugs();
    return guides.map((guide) => ({ slug: guide.slug }));
  } catch {
    // No database at build time: render on demand instead of failing the build.
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug).catch(() => null);
  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.excerpt,
      url: `/guides/${slug}`,
      images: guide.image ? [{ url: guide.image }] : undefined,
      publishedTime: guide.createdAt.toISOString(),
      modifiedTime: guide.updatedAt.toISOString(),
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug).catch(() => null);
  if (!guide) notFound();

  const { title, excerpt, content, tags, image, readingTimeMinutes } = guide;
  const url = absolute(`/guides/${slug}`);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "StudentOS Africa", url: absolute("/") },
    publisher: { "@type": "Organization", name: "StudentOS Africa", url: absolute("/") },
    ...(image ? { image: [image] } : {}),
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    inLanguage: "en-NG",
  };

  return (
    <div className="container-site py-10 md:py-14">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", url: absolute("/") }, { name: "Guides", url: absolute("/guides") }, { name: title, url }])]} />

      <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Guides
      </Link>

      <article className="mx-auto flex max-w-prose flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest">{tag}</span>
            ))}
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">{title}</h1>
          <p className="leading-relaxed text-muted">{excerpt}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {readingTimeMinutes} min read · Updated {guide.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        {image && (
          <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-sage md:h-80">
            <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" priority />
          </div>
        )}

        <GuideContent content={content} />
      </article>
    </div>
  );
}
