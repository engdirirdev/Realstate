// ================================================================
// PAGE NAME  : AI Assistant (Chatbot) Page
// ROUTE      : /ai-assistant
// DESCRIPTION: Conversational AI chatbot powered by Google Gemini
//              API + database-grounded real property results
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, User, Loader2, Sparkles, MessageSquare, MapPin,
  BedDouble, Bath, ExternalLink, Heart, Scale, Share2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import type { GroundedPropertyResult } from "@/lib/chat-grounding-engine";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  properties?: GroundedPropertyResult[];
}

const SUGGESTIONS = [
  "Find me a 3-bedroom house in Mogadishu under $80,000",
  "What luxury apartments are available in Hargeisa?",
  "Show me prime villas in Somalia",
  "Show houses in Galkayo",
  "Find furnished estates with dedicated security",
];

export default function AIAssistantPage() {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check for URL param ?q=
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInput(q);
  }, []);

  const handleFavoriteToggle = async (propId: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: propId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: data.action === "added" ? "Saved to Favorites! ❤️" : "Removed from Favorites" });
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
      toast({ title: "Link Copied! 📋", description: `Copied link for "${propTitle}"` });
    }
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

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

  return (
    <div className="py-10 bg-[#F7F3EA] min-h-screen">
      <div className="section-container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Kiro-Maal Intelligence
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F]">AI Property Concierge</h1>
          <p className="text-[#6B7280] text-sm mt-1.5 max-w-lg mx-auto">
            Live conversational assistant querying Somalia&apos;s verified real estate inventory in real time.
          </p>
        </div>

        {/* Chat Window */}
        <div className="bg-[#FCFBF7] rounded-2xl shadow-md border border-[#E8E1D4] overflow-hidden flex flex-col" style={{ height: "68vh" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === "user" ? "bg-[#C89B3C] text-[#07111F]" : "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                }`}>
                  {msg.role === "user"
                    ? <User className="h-4 w-4" />
                    : <Bot className="h-4 w-4" />
                  }
                </div>
                <div className="space-y-3 max-w-[85%]">
                  <div className={`p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-medium rounded-2xl rounded-tr-sm shadow-sm"
                      : "bg-white border border-[#E8E1D4] text-[#07111F] rounded-2xl rounded-tl-sm shadow-sm"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 font-medium ${msg.role === "user" ? "text-[#07111F]/70" : "text-[#9CA3AF]"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Grounded Real Properties Cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {msg.properties.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-[#E8E1D4] rounded-2xl p-3.5 shadow-sm space-y-2.5 hover:border-[#C89B3C] transition-all"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EA] flex-shrink-0 border border-[#E8E1D4] relative">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9CA3AF]">
                                  No image
                                </div>
                              )}
                              <span className="absolute top-1 left-1 bg-[#07111F]/80 backdrop-blur-sm text-[#D9B45B] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {p.typeLabel}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.statusColor}`}>
                                  {p.statusEmoji}
                                </span>
                                <span className="text-[10px] font-bold text-[#A97918] bg-[#C89B3C]/15 border border-[#C89B3C]/30 px-1.5 py-0.5 rounded">
                                  ★ {p.aiMatchScore}% Match
                                </span>
                              </div>

                              <h4 className="font-serif font-bold text-[#07111F] text-xs mt-1 truncate">{p.title}</h4>
                              <p className="text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3 text-[#C89B3C] flex-shrink-0" /> {p.district ? `${p.district}, ` : ""}{p.city}
                              </p>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-sm font-extrabold text-[#07111F]">{p.formattedPrice}</span>
                                <span className="text-[10px] text-[#C89B3C] font-bold uppercase tracking-wider">{p.listingType}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#FCFBF7] rounded-xl text-[10px] text-[#6B7280] border border-[#E8E1D4]">
                            <span className="flex items-center gap-1 truncate font-medium">
                              <BedDouble className="h-3 w-3 text-[#C89B3C]" /> {p.bedrooms} Beds
                            </span>
                            <span className="flex items-center gap-1 truncate font-medium">
                              <Bath className="h-3 w-3 text-[#C89B3C]" /> {p.bathrooms} Baths
                            </span>
                            <span className="truncate">{p.areaSize} m²</span>
                            <span className="truncate">Living: {p.livingRooms}</span>
                            <span className="truncate">Park: {p.parkingSpaces}</span>
                            <span className="truncate">{p.furnished ? "Furnished" : "Unfurnished"}</span>
                          </div>

                          {/* Amenity Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-[#4B5563]">
                            {p.swimmingPool && (
                              <span className="px-1.5 py-0.5 bg-[#FCFBF7] text-[#07111F] rounded-md font-medium border border-[#E8E1D4]">
                                🏊 Pool
                              </span>
                            )}
                            {p.garden && (
                              <span className="px-1.5 py-0.5 bg-[#FCFBF7] text-[#07111F] rounded-md font-medium border border-[#E8E1D4]">
                                🌳 Garden
                              </span>
                            )}
                            {p.security && (
                              <span className="px-1.5 py-0.5 bg-[#07111F] text-[#D9B45B] rounded-md font-medium border border-[#C89B3C]/30">
                                🛡️ Security
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-[#FCFBF7] text-[#07111F] rounded-md font-medium border border-[#E8E1D4]">
                              ⚡ 24/7 Utilities
                            </span>
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <Link
                              href={`/properties/${p.id}`}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl text-xs font-bold shadow-sm hover:brightness-105 transition-all"
                            >
                              <ExternalLink className="h-3 w-3" /> View Full Details
                            </Link>

                            <Link
                              href={`/properties/${p.id}`}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] rounded-xl text-[11px] font-medium transition-colors"
                            >
                              <Calendar className="h-3 w-3 text-[#C89B3C]" /> Book Visit
                            </Link>

                            <Link
                              href={`/properties/compare?ids=${p.id}`}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] rounded-xl text-[11px] font-medium transition-colors"
                            >
                              <Scale className="h-3 w-3 text-[#C89B3C]" /> Compare
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleFavoriteToggle(p.id)}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] rounded-xl text-[11px] font-medium transition-colors"
                            >
                              <Heart className="h-3 w-3 text-[#C89B3C]" /> Save
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareProperty(p.id, p.title)}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] rounded-xl text-[11px] font-medium transition-colors"
                            >
                              <Share2 className="h-3 w-3 text-[#C89B3C]" /> Share
                            </button>

                            <button
                              type="button"
                              onClick={() => sendMessage(`Tell me more details about "${p.title}" in ${p.city}`)}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] hover:bg-[#0B1728] rounded-xl text-[11px] font-semibold transition-all"
                            >
                              <Sparkles className="h-3 w-3 text-[#C89B3C]" /> Inquire Regarding This Property
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
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-[#D9B45B]" />
                </div>
                <div className="bg-white border border-[#E8E1D4] text-[#07111F] rounded-2xl rounded-tl-sm shadow-sm p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" />
                  <span className="text-xs text-[#6B7280] font-medium">Querying verified database inventory...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-[#F7F3EA] text-[#07111F] hover:bg-[#07111F] hover:text-[#D9B45B] border border-[#E8E1D4] hover:border-[#C89B3C] px-3.5 py-1.5 rounded-full transition-all font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-[#E8E1D4] p-4 flex gap-3 bg-[#FCFBF7]">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918]" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about luxury villas, market valuations, locations, or amenities..."
                rows={1}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C]"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="lg"
              className="flex-shrink-0 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl border-0 shadow-sm transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Info note */}
        <p className="text-center text-xs text-[#6B7280] mt-3">
          🔒 Grounded in Kiro-Maal verified real estate data. Powered by Gemini AI.
        </p>
      </div>
    </div>
  );
}
