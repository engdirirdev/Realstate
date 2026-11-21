"use client";

import { useState, useEffect, useCallback } from "react";

export type PortalLanguage = "en" | "so";

const STORAGE_KEY = "kiromaal_portal_lang";
const EVENT_NAME = "kiromaal-language-change";

export function getStoredLanguage(): PortalLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "so" || saved === "en") return saved;
  } catch {
    // ignore
  }
  return "en";
}

export function setStoredLanguage(lang: PortalLanguage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000`;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: lang }));
  } catch {
    // ignore
  }
}

export function usePortalLanguage(): [PortalLanguage, (lang: PortalLanguage) => void] {
  const [lang, setLangState] = useState<PortalLanguage>("en");

  useEffect(() => {
    setLangState(getStoredLanguage());

    const handleLangEvent = (e: Event) => {
      const custom = e as CustomEvent<PortalLanguage>;
      if (custom.detail === "en" || custom.detail === "so") {
        setLangState(custom.detail);
      } else {
        setLangState(getStoredLanguage());
      }
    };

    window.addEventListener(EVENT_NAME, handleLangEvent);
    window.addEventListener("storage", handleLangEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleLangEvent);
      window.removeEventListener("storage", handleLangEvent);
    };
  }, []);

  const setLang = useCallback((nextLang: PortalLanguage) => {
    setLangState(nextLang);
    setStoredLanguage(nextLang);
  }, []);

  return [lang, setLang];
}

