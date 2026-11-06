"use client";

import React, { useEffect, useState } from "react";

/**
 * WCAG 2.1 Level AA Skip to Content Link.
 * Allows keyboard users to bypass repetitive navigation headers.
 * Uses a client-only mount pattern (useEffect) to ensure 100% server-client hydration parity
 * and prevent third-party browser extensions (e.g. link openers, ad blockers, security extensions)
 * from causing hydration mismatch errors.
 */
export default function SkipToContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById("main-content");
    if (main) {
      main.tabIndex = -1;
      main.focus();
      main.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#07111F] focus:text-[#FCFBF7] focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C89B3C] focus:ring-offset-2 focus:border focus:border-[#C89B3C]/50 font-bold text-sm transition-all cursor-pointer"
    >
      Skip to main content (U gudub nuxurka bogga)
    </a>
  );
}
