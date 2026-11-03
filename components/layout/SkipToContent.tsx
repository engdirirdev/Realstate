"use client";

import React from "react";

/**
 * WCAG 2.1 Level AA Skip to Content Link.
 * Allows keyboard users to bypass repetitive navigation headers.
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-emerald-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 font-medium text-sm transition-all"
    >
      Skip to main content (U gudub nuxurka bogga)
    </a>
  );
}
