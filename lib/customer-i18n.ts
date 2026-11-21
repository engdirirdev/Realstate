"use client";

import { useState, useEffect, useCallback } from "react";

export type PortalLanguage = "en" | "so";
export type PortalTheme = "day" | "night";

const STORAGE_KEY = "kiromaal_portal_lang";
const EVENT_NAME = "kiromaal-language-change";

const THEME_STORAGE_KEY = "kiromaal_portal_theme";
const THEME_EVENT_NAME = "kiromaal-theme-change";

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

export function applyThemeToDocument(theme: PortalTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-portal-theme", theme);
  if (theme === "night") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function getStoredTheme(): PortalTheme {
  if (typeof window === "undefined") return "day";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "night" || saved === "day") return saved;
  } catch {
    // ignore
  }
  return "day";
}

export function setStoredTheme(theme: PortalTheme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000`;
    applyThemeToDocument(theme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: theme }));
  } catch {
    // ignore
  }
}

export function usePortalTheme(): [PortalTheme, (theme: PortalTheme) => void] {
  const [theme, setThemeState] = useState<PortalTheme>("day");

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    applyThemeToDocument(initial);

    const handleThemeEvent = (e: Event) => {
      const custom = e as CustomEvent<PortalTheme>;
      const next =
        custom.detail === "day" || custom.detail === "night"
          ? custom.detail
          : getStoredTheme();
      setThemeState(next);
      applyThemeToDocument(next);
    };

    window.addEventListener(THEME_EVENT_NAME, handleThemeEvent);
    window.addEventListener("storage", handleThemeEvent);
    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleThemeEvent);
      window.removeEventListener("storage", handleThemeEvent);
    };
  }, []);

  const setTheme = useCallback((nextTheme: PortalTheme) => {
    setThemeState(nextTheme);
    setStoredTheme(nextTheme);
  }, []);

  return [theme, setTheme];
}
