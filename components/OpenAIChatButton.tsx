"use client";

import React from "react";

interface OpenAIChatButtonProps {
  className?: string;
  children: React.ReactNode;
  prefillMessage?: string;
}

export default function OpenAIChatButton({
  className,
  children,
  prefillMessage,
}: OpenAIChatButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (prefillMessage) {
        window.dispatchEvent(
          new CustomEvent("open-ai-chat", { detail: { message: prefillMessage } })
        );
      } else {
        window.dispatchEvent(new Event("open-ai-chat"));
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}
