"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bot } from "lucide-react";

export default function AIAssistantPage() {
  const router = useRouter();

  useEffect(() => {
    // Read optional query parameter ?q=
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        window.dispatchEvent(
          new CustomEvent("open-ai-chat", { detail: { message: q } })
        );
      } else {
        window.dispatchEvent(new Event("open-ai-chat"));
      }
    }

    // Redirect to properties catalog with assistant opened
    const timer = setTimeout(() => {
      router.replace("/properties");
    }, 120);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-[#F5F1EA] text-[#07111F] p-6">
      <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-[#DCE6F2] shadow-2xl max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C89B3C] via-[#D9B45B] to-[#A97918] flex items-center justify-center text-[#07111F] shadow-lg shadow-[#C89B3C]/25 animate-pulse">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-serif text-[#07111F]">Opening AI Assistant...</h2>
          <p className="text-xs text-[#6B7280] mt-1.5">Launching the portal AI concierge with live database grounding.</p>
        </div>
        <Loader2 className="w-6 h-6 text-[#C89B3C] animate-spin mt-2" />
      </div>
    </div>
  );
}
