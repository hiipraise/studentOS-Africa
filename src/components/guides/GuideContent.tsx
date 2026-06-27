import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface GuideContentProps {
  content: string;
}

export function GuideContent({ content }: GuideContentProps) {
  return (
    <div className="prose prose-neutral max-w-none
      prose-headings:font-sans prose-headings:font-bold prose-headings:text-ink prose-headings:tracking-tight
      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
      prose-p:text-ink/80 prose-p:leading-relaxed
      prose-a:text-forest prose-a:font-medium prose-a:no-underline hover:prose-a:underline
      prose-strong:text-ink prose-strong:font-semibold
      prose-li:text-ink/80 prose-li:leading-relaxed
      prose-blockquote:border-l-forest prose-blockquote:bg-sage/50 prose-blockquote:py-1 prose-blockquote:not-italic
      prose-code:text-forest prose-code:bg-sage prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
      prose-img:rounded-xl prose-img:border prose-img:border-border
      prose-hr:border-border
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
