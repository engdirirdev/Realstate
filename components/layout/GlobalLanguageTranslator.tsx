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

export default function GlobalLanguageTranslator() {
  const [lang] = usePortalLanguage();
  const originalTextMap = useRef<WeakMap<Text, string>>(new WeakMap());
  const originalAttrMap = useRef<WeakMap<Element, Record<string, string>>>(new WeakMap());
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
              if (!originalTextMap.current.has(node)) {
                originalTextMap.current.set(node, currentVal);
              }
              const originalEn = originalTextMap.current.get(node) || currentVal;

              if (targetLang === "so") {
                const translated = translateToSomali(originalEn);
                if (translated !== currentVal) {
                  node.nodeValue = translated;
                }
              } else {
                if (originalEn !== currentVal) {
                  node.nodeValue = originalEn;
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
            const saved = originalAttrMap.current.get(el) || {};

            const placeholder = el.getAttribute("placeholder");
            if (placeholder) {
              if (saved.placeholder === undefined) saved.placeholder = placeholder;
              const nextPlaceholder =
                targetLang === "so"
                  ? translateToSomali(saved.placeholder)
                  : saved.placeholder;
              if (nextPlaceholder !== placeholder) {
                el.setAttribute("placeholder", nextPlaceholder);
              }
            }

            const title = el.getAttribute("title");
            if (title) {
              if (saved.title === undefined) saved.title = title;
              const nextTitle =
                targetLang === "so" ? translateToSomali(saved.title) : saved.title;
              if (nextTitle !== title) {
                el.setAttribute("title", nextTitle);
              }
            }

            originalAttrMap.current.set(el, saved);
          });
        }
      } finally {
        isApplyingRef.current = false;
      }
    };

    // Initial pass
    applyTranslationToSubtree(document.body, lang);

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
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [lang]);

  return null;
}

