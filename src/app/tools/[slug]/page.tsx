import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getToolBySlug } from "@/lib/data/tools";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) return { title: "Tool not found" };

  return {
    title: tool.title,
    description: tool.description.slice(0, 160),
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) notFound();

  const { title, description, category, officialLink, image, free } = tool;

  return (
    <div className="container-site py-10 md:py-14">
      <Link
        href="/tools"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Tools
      </Link>

      <div className="mx-auto max-w-2xl">
        <div className="card-base flex flex-col gap-6 p-8">
          <div className="flex items-center gap-4">
            {image ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
                <Image src={image} alt={`${title} logo`} fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage border border-border">
                <span className="text-xl font-bold text-forest">{title[0]}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest">
                  {category}
                </span>
                {free && (
                  <span className="rounded-full bg-forest/8 px-2.5 py-0.5 text-xs font-medium text-forest border border-forest/20">
                    Free
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-ink/80 leading-relaxed text-[15px]">{description}</p>

          <a href={officialLink} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
            Open {title}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
