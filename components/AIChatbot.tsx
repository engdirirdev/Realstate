// ================================================================
// COMPONENT  : AIChatbot
// BRAND      : Kiro-Maal Real Estate
// PALETTE    : Deep Navy (#07111F), Luxury Gold (#C89B3C), Cream (#F7F3EA)
// DESCRIPTION: Master AI Assistant with full grounding engine,
//              live database query, and gold luxury branding
// ================================================================
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  MessageSquare,
  MapPin,
  BedDouble,
  Bath,
  ExternalLink,
  Heart,
  Share2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { GroundedPropertyResult } from "@/lib/chat-grounding-engine";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  properties?: GroundedPropertyResult[];
}

export default function AIChatbot() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role || "PUBLIC";
  const userName = session?.user?.name || "Guest";

  // Listen for global open event
  useEffect(() => {
    const handleOpen = (e?: any) => {
      setIsOpen(true);
      if (e?.detail?.message) {
        setInput(e.detail.message);
      }
    };
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  // Role-aware suggestions
  const getSuggestions = () => {
    if (role === "ADMIN") {
      return [
        "How many pending properties need review?",
        "Show platform revenue summary",
        "How many registered users are active?",
      ];
    }
    if (role === "USER") {
      return [
        "How many properties do I have listed?",
        "Show my pending or rejected listings",
        "How can I improve my property descriptions?",
      ];
    }
    if (role === "CUSTOMER") {
      return [
        "Recommend properties matching my budget",
        "Show 3-bedroom houses in Mogadishu",
        "Explain how ML price prediction works",
      ];
    }
    return [
      "Find apartments under $50,000",
      "What real estate services do you provide?",
      "Show me properties in Mogadishu",
    ];
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText =
        role === "ADMIN"
          ? `Hello Admin ${userName}! I can help you monitor pending approvals, platform stats, and revenue.`
          : role === "USER"
          ? `Hello Agent ${userName}! Ask me about your property listings, approval statuses, or inquiries.`
          : role === "CUSTOMER"
          ? `Welcome ${userName}! I can recommend properties based on your preferences or answer housing questions.`
          : `Welcome to Kiro-Maal Real Estate! Ask me anything about properties, locations, or price predictions in Somalia.`;

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [role, userName, messages.length]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);
    setError(null);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, sessionId, history: chatHistory }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Too many requests. Please wait a moment before asking again.");
          return;
        }
        throw new Error(data.error || "Failed to get response");
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "No response received.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        properties: data.shouldRenderPropertyCards && data.properties ? data.properties : [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError("Unable to connect to AI server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (propId: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: propId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title:
            data.action === "added"
              ? "Saved to Favorites! ❤️"
              : "Removed from Favorites",
        });
      } else {
        toast({ title: "Notice", description: "Sign in to save properties." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update favorites." });
    }
  };

  const handleShareProperty = (propId: string, propTitle: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/properties/${propId}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied! 📋",
        description: `Copied link for "${propTitle}"`,
      });
    }
  };

  // Do not render floating chatbot button over authentication forms
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {/* ─── Floating Trigger Pill Button (Matches Master Reference) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 bg-[#0B1523] hover:bg-[#122136] text-white px-5 py-3 rounded-full shadow-2xl border border-[#C89B3C]/50 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/40 text-[#D9B45B] flex items-center justify-center">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold text-sm tracking-wide pr-1 text-white">
            Ask AI Assistant
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#C89B3C] ring-4 ring-[#C89B3C]/20 animate-pulse" />
        </button>
      )}

      {/* ─── Kiro-Maal AI Assistant Modal Window ─── */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[420px] md:w-[440px] h-[610px] bg-[#FCFBF7] rounded-[32px] shadow-[0_25px_70px_rgba(7,17,31,0.4)] border border-[#C89B3C]/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 relative">
          {/* ─── Top Header with Deep Navy & Gold Accents ─── */}
          <div className="relative bg-[#07111F] text-white px-5 py-4 flex items-center justify-between overflow-hidden shrink-0 border-b border-[#C89B3C]/30">
            {/* Subtle Villa Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
              <Image
                src="/images/luxury_villa_twilight.jpg"
                alt="Twilight Villa"
                fill
                className="object-cover object-right"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#07111F] via-[#0B1728]/95 to-[#07111F]/80" />

            {/* Left Header: Bot Badge & Title */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#A97918] flex items-center justify-center text-[#07111F] shadow-md shadow-black/40 shrink-0 font-bold">
                <Bot className="w-6 h-6 text-[#07111F]" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-white tracking-tight leading-snug">
                  Kiro-Maal AI Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
                  <span className="text-[11px] text-[#D9B45B] font-semibold tracking-wide">
                    {role === "ADMIN"
                      ? "Admin Mode"
                      : role === "USER"
                      ? "Manager Mode"
                      : role === "CUSTOMER"
                      ? "Customer Mode"
                      : "Public Mode"}{" "}
                    • Live Database
                  </span>
                </div>
              </div>
            </div>

            {/* Right Header: Circular Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ─── Chat Messages Area ─── */}
          <div className="relative flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#F7F3EA]/90 via-[#FCFBF7] to-[#F7F3EA]/90">
            {/* Conversation Flow */}
            <div className="relative z-10 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user"
                      ? "ml-auto flex-row-reverse max-w-[85%]"
                      : "mr-auto max-w-[95%]"
                  )}
                >
                  {/* Bot Avatar */}
                  {msg.role === "assistant" && (
                    <div className="relative w-8 h-8 rounded-full bg-[#07111F] border-2 border-[#C89B3C] flex items-center justify-center text-[#D9B45B] shadow-xs shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C89B3C] ring-2 ring-white" />
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "p-4 rounded-[22px] text-xs sm:text-sm leading-relaxed shadow-xs transition-all",
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#B88924] text-[#07111F] rounded-tr-none font-bold"
                          : "bg-white text-[#07111F] border border-[#E8E1D4] rounded-tl-xs"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span
                        className={cn(
                          "block text-[10px] mt-1.5 text-right font-normal",
                          msg.role === "user"
                            ? "text-[#07111F]/75"
                            : "text-[#6B7280]"
                        )}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Grounded Real Properties Cards */}
                    {msg.properties && msg.properties.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {msg.properties.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-[#E8E1D4] rounded-2xl p-3.5 shadow-xs space-y-3 hover:border-[#C89B3C] transition-colors"
                          >
                            <div className="flex gap-3">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#E8E1D4] relative">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                    No image
                                  </div>
                                )}
                                <span className="absolute top-1 left-1 bg-[#07111F]/80 text-[#D9B45B] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {p.typeLabel}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.statusColor}`}
                                  >
                                    {p.statusEmoji}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FBF7EE] px-1.5 py-0.5 rounded border border-[#E8DCC2]">
                                    ★ {p.aiMatchScore}% Match
                                  </span>
                                </div>

                                <h4 className="font-bold text-[#07111F] text-xs mt-1 truncate">
                                  {p.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />{" "}
                                  {p.district ? `${p.district}, ` : ""}
                                  {p.city}
                                </p>
                                <div className="flex items-baseline justify-between mt-1">
                                  <span className="text-sm font-black text-[#07111F]">
                                    {p.formattedPrice}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {p.listingType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Property Specifications */}
                            <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[10px] text-slate-700 border border-[#E8E1D4]">
                              <span className="flex items-center gap-1 truncate">
                                <BedDouble className="h-3 w-3 text-[#C89B3C]" />{" "}
                                {p.bedrooms} Beds
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <Bath className="h-3 w-3 text-[#C89B3C]" />{" "}
                                {p.bathrooms} Baths
                              </span>
                              <span className="truncate">{p.areaSize} m²</span>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <Link
                                href={`/properties/${p.id}`}
                                className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#C89B3C] hover:bg-[#B88924] text-[#07111F] rounded-xl text-xs font-bold shadow-xs transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" /> View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleFavoriteToggle(p.id)}
                                className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
                              >
                                <Heart className="h-3 w-3 text-rose-500" /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareProperty(p.id, p.title)}
                                className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
                              >
                                <Share2 className="h-3 w-3 text-[#C89B3C]" /> Share
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#07111F] bg-[#FBF7EE] border border-[#E8DCC2] px-3.5 py-2.5 rounded-2xl w-max shadow-2xs animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" /> AI
                  Assistant is searching database...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ─── Quick Suggested Action Pills ─── */}
          <div className="relative z-10 px-4 pt-2 pb-1.5 bg-[#F7F3EA] flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {getSuggestions().map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={loading}
                className="group inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-white hover:bg-[#FBF7EE] border border-[#E8E1D4] hover:border-[#C89B3C] px-3.5 py-1.5 rounded-full shadow-2xs whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C89B3C] group-hover:scale-110 transition-transform" />
                <span>{sug}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#C89B3C] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          {/* ─── Bottom Input Bar with Curved Glass Container ─── */}
          <div className="relative z-10 p-3 bg-gradient-to-t from-[#EDE7DC] to-[#F7F3EA] border-t border-[#E8E1D4]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="bg-white rounded-2xl border border-[#E8E1D4] p-1.5 flex items-center gap-2 shadow-sm transition-all focus-within:border-[#C89B3C] focus-within:ring-2 focus-within:ring-[#C89B3C]/20"
            >
              {/* Message icon inside input on left */}
              <div className="pl-2.5 text-slate-400 shrink-0">
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>

              {/* Input text field */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI about properties, prices..."
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#07111F] placeholder:text-slate-400 py-1.5 px-1 focus:ring-0"
              />

              {/* Send Button: Luxury Gold Squircle with Paper Airplane */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-[#07111F] font-bold shrink-0 transition-all duration-200",
                  loading || !input.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-br from-[#C89B3C] via-[#D9B45B] to-[#B88924] shadow-md shadow-[#C89B3C]/25 hover:scale-105 active:scale-95 cursor-pointer"
                )}
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#07111F]" />
                ) : (
                  <Send className="w-4 h-4 -rotate-12 -translate-x-[1px] -translate-y-[1px]" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
