"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bot } from "lucide-react";

export default function AIAssistantPage() {
<<<<<<< HEAD
  const router = useRouter();
=======
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Welcome to Kiro-Maal Real Estate Concierge. I am connected live to our verified property database across Somalia. I can recommend exclusive listings, estimate valuation indices, compare amenities, and answer any property questions.\n\nWhat can I assist you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
>>>>>>> 1a04d526277b6dcc468ae22e8e83397673c6e17c

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

<<<<<<< HEAD
    return () => clearTimeout(timer);
  }, [router]);
=======
    const userMessage: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send conversation history to preserve filter memory
      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: chatHistory,
          sessionId: sessionId || undefined,
        }),
      });
      const data = await res.json();
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
          properties: data.shouldRenderPropertyCards && data.properties ? data.properties : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please check your network and try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
>>>>>>> 1a04d526277b6dcc468ae22e8e83397673c6e17c

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
