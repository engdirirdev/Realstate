"use client";

import { useEffect, useRef } from "react";
import { usePortalLanguage } from "@/lib/customer-i18n";
import { translateToSomali } from "@/lib/global-somali-dictionary";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "SVG",
  "PATH",
  "META",
  "LINK",
]);

function shouldSkipElement(el: Element | null): boolean {
  let curr: Element | null = el;
  while (curr) {
    if (SKIP_TAGS.has(curr.tagName)) return true;
    if (curr.getAttribute("data-no-translate") === "true") return true;
    curr = curr.parentElement;
  }
  return false;
}

interface TranslatedNodeRecord {
  originalEn: string;
  translatedSo: string;
}

interface TranslatedAttrRecord {
  placeholder?: { originalEn: string; translatedSo: string };
  title?: { originalEn: string; translatedSo: string };
}

export default function GlobalLanguageTranslator() {
  const [lang] = usePortalLanguage();
  // Only track nodes/attributes that THIS translator actually mutated!
  // This prevents ever overwriting React-managed bilingual components.
  const textRecords = useRef<WeakMap<Text, TranslatedNodeRecord>>(new WeakMap());
  const attrRecords = useRef<WeakMap<Element, TranslatedAttrRecord>>(new WeakMap());
  const isApplyingRef = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const applyTranslationToSubtree = (root: Node, targetLang: "so" | "en") => {
      if (isApplyingRef.current) return;
      isApplyingRef.current = true;

      try {
        // 1. Walk all text nodes
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode() as Text | null;

        while (node) {
          const parentEl = node.parentElement;
          if (parentEl && !shouldSkipElement(parentEl)) {
            const currentVal = node.nodeValue || "";
            if (currentVal.trim().length > 0) {
              const rec = textRecords.current.get(node);

              if (targetLang === "so") {
                // If already translated by us and unchanged, skip
                if (rec && currentVal === rec.translatedSo) {
                  node = walker.nextNode() as Text | null;
                  continue;
                }
                const translated = translateToSomali(currentVal);
                if (translated !== currentVal) {
                  textRecords.current.set(node, {
                    originalEn: currentVal,
                    translatedSo: translated,
                  });
                  node.nodeValue = translated;
                }
              } else {
                // Switching to English: ONLY restore if WE translated this node
                // and React hasn't already updated it to something else
                if (rec && currentVal === rec.translatedSo) {
                  node.nodeValue = rec.originalEn;
                  textRecords.current.delete(node);
                } else if (rec && currentVal !== rec.translatedSo) {
                  // React updated this node natively; stop tracking it
                  textRecords.current.delete(node);
                }
              }
            }
          }
          node = walker.nextNode() as Text | null;
        }

        // 2. Translate input/textarea placeholders & titles
        if (root instanceof Element || root instanceof Document) {
          const elements = root.querySelectorAll("input[placeholder], textarea[placeholder], [title]");
          elements.forEach((el) => {
            if (shouldSkipElement(el)) return;
            const rec = attrRecords.current.get(el) || {};

            const placeholder = el.getAttribute("placeholder");
            if (placeholder) {
              if (targetLang === "so") {
                if (!rec.placeholder || placeholder !== rec.placeholder.translatedSo) {
                  const translated = translateToSomali(placeholder);
                  if (translated !== placeholder) {
                    rec.placeholder = { originalEn: placeholder, translatedSo: translated };
                    el.setAttribute("placeholder", translated);
                  }
                }
              } else if (rec.placeholder) {
                if (placeholder === rec.placeholder.translatedSo) {
                  el.setAttribute("placeholder", rec.placeholder.originalEn);
                }
                delete rec.placeholder;
              }
            }

            const title = el.getAttribute("title");
            if (title) {
              if (targetLang === "so") {
                if (!rec.title || title !== rec.title.translatedSo) {
                  const translated = translateToSomali(title);
                  if (translated !== title) {
                    rec.title = { originalEn: title, translatedSo: translated };
                    el.setAttribute("title", translated);
                  }
                }
              } else if (rec.title) {
                if (title === rec.title.translatedSo) {
                  el.setAttribute("title", rec.title.originalEn);
                }
                delete rec.title;
              }
            }

            if (rec.placeholder || rec.title) {
              attrRecords.current.set(el, rec);
            } else {
              attrRecords.current.delete(el);
            }
          });
        }
      } finally {
        isApplyingRef.current = false;
      }
    };

    // Initial pass after React commits the new language render
    const initRaf = requestAnimationFrame(() => {
      applyTranslationToSubtree(document.body, lang);
    });

    // Observe dynamic route transitions, modals, and async content
    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (isApplyingRef.current) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        applyTranslationToSubtree(document.body, lang);
        rafId = null;
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelAnimationFrame(initRaf);
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [lang]);

  return null;
}
