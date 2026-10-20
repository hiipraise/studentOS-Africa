"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onToken: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; theme?: string }) => string;
      remove: (id: string) => void;
    };
  }
}

/**
 * Optional Cloudflare Turnstile widget. Renders nothing when the site key is
 * not configured, so local development and CI keep working without a key.
 */
export function Turnstile({ onToken }: TurnstileProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;

    function render() {
      if (cancelled || !container.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey!,
        theme: "light",
        callback: onToken,
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-studentos-turnstile="true"]');
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.studentosTurnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={container} className="min-h-[65px]" aria-label="Spam protection" />;
}
