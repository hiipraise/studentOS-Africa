"use client";

import { useCallback, useEffect, useState } from "react";
import { LOCALE_COOKIE, localeFromValue, translate, type Locale, type TranslationKey } from "@/lib/i18n";

const CHANGE_EVENT = "studentos-locale-change";

function readLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  return localeFromValue(value);
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(readLocale());
    const onChange = () => setLocale(readLocale());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const change = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    window.dispatchEvent(new Event(CHANGE_EVENT));
    setLocale(next);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  return { locale, setLocale: change, t };
}

export { CHANGE_EVENT };
