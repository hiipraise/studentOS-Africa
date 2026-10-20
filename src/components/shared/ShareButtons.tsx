"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Send, Twitter } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url: string;
  text?: string;
}

export function ShareButtons({ title, url, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const message = text ?? `Check out ${title} on StudentOS Africa`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-border rounded-lg px-3 py-2 text-xs inline-flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
      </a>
      <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-border rounded-lg px-3 py-2 text-xs inline-flex items-center gap-1.5">
        <Send className="h-3.5 w-3.5" aria-hidden="true" /> Telegram
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-border rounded-lg px-3 py-2 text-xs inline-flex items-center gap-1.5">
        <Twitter className="h-3.5 w-3.5" aria-hidden="true" /> X
      </a>
      <button onClick={copy} className="btn-ghost border border-border rounded-lg px-3 py-2 text-xs inline-flex items-center gap-1.5">
        {copied ? <Check className="h-3.5 w-3.5 text-forest" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
