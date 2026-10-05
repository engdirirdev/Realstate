"use client";

import { ArrowRight } from "lucide-react";

export default function CustomerAiChatButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-ai-chat"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#C89B3C]/20 flex items-center gap-1.5 cursor-pointer"
    >
      <span>Chat Now</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}
