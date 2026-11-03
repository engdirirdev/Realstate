import React from "react";

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Renders safely sanitized JSON-LD script for search engine crawlers.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
