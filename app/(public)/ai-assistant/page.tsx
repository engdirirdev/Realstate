// ================================================================
// PAGE NAME  : AI Assistant (Chatbot) Page
// ROUTE      : /ai-assistant
// DESCRIPTION: Conversational AI chatbot powered by Google Gemini
//              API + database-grounded real property results
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
  "What apartments are available in Hargeisa?",
  "Show me villas in Somalia",
  "Show houses in Galkayo",
  "Find furnished apartments with parking",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm your AI real estate assistant. I am connected live to our database in Somalia. I can help you find verified properties, check prices, compare options, and give you real-time market inventory.\n\nWhat are you looking for today?",
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
        body: JSON.stringify({ message: content, history: chatHistory }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
          properties: data.properties || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please check your internet and try again.", timestamp: new Date() },
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
    <div className="section-container py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#ECFEFF] text-[#0891B2] px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Sparkles className="h-4 w-4" /> AI-Powered Assistant
          </div>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">AI Property Assistant</h1>
          <p className="text-[#64748B] mt-1">Ask anything about properties — I'll search the database for you</p>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden flex flex-col" style={{ height: "65vh" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-[#10B981]" : "bg-[#06B6D4]"
                }`}>
                  {msg.role === "user"
                    ? <User className="h-4 w-4 text-white" />
                    : <Bot className="h-4 w-4 text-white" />
                  }
                </div>
                <div className="space-y-3 max-w-[85%]">
                  <div className={`p-4 ${msg.role === "user" ? "bg-[#10B981] text-white rounded-2xl rounded-tr-sm" : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl rounded-tl-sm shadow-sm"}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === "user" ? "text-[#E2E8F0]" : "text-[#94A3B8]"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Grounded Real Properties Cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {msg.properties.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-sm space-y-2.5 hover:border-[#10B981] transition-colors"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-[#E2E8F0] relative">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#94A3B8]">
                                  No image
                                </div>
                              )}
                              <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {p.typeLabel}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.statusColor}`}>
                                  {p.statusEmoji}
                                </span>
                                <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">
                                  ★ {p.aiMatchScore}% Match
                                </span>
                              </div>

                              <h4 className="font-bold text-[#0F172A] text-xs mt-1 truncate">{p.title}</h4>
                              <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3 text-[#10B981] flex-shrink-0" /> {p.district ? `${p.district}, ` : ""}{p.city}
                              </p>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-sm font-extrabold text-[#059669]">{p.formattedPrice}</span>
                                <span className="text-[10px] text-[#64748B] font-medium">{p.listingType}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 py-1 px-2 bg-[#F8FAFC] rounded-xl text-[10px] text-[#64748B] border border-[#E2E8F0]">
                            <span className="flex items-center gap-1 truncate">
                              <BedDouble className="h-3 w-3 text-[#10B981]" /> {p.bedrooms} Beds
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <Bath className="h-3 w-3 text-[#3B82F6]" /> {p.bathrooms} Baths
                            </span>
                            <span className="truncate">{p.areaSize} m²</span>
                            <span className="truncate">Living: {p.livingRooms}</span>
                            <span className="truncate">Park: {p.parkingSpaces}</span>
                            <span className="truncate">{p.furnished ? "Furnished" : "Unfurnished"}</span>
                          </div>

                          {/* Amenity Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-[#475569]">
                            {p.swimmingPool && (
                              <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] rounded-md font-medium border border-[#BFDBFE]">
                                🏊 Pool
                              </span>
                            )}
                            {p.garden && (
                              <span className="px-1.5 py-0.5 bg-[#ECFDF5] text-[#047857] rounded-md font-medium border border-[#A7F3D0]">
                                🌳 Garden
                              </span>
                            )}
                            {p.security && (
                              <span className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#334155] rounded-md font-medium border border-[#E2E8F0]">
                                🛡️ Security
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-[#F0FDF4] text-[#15803D] rounded-md font-medium border border-[#BBF7D0]">
                              ⚡ 24/7 Power &amp; Water
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#FEF2F2] text-[#B91C1C] rounded-md font-medium border border-[#FECACA]">
                              ✓ {p.managerName}
                            </span>
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <Link
                              href={`/properties/${p.id}`}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold"
                            >
                              <ExternalLink className="h-3 w-3" /> View Full Details
                            </Link>

                            <Link
                              href={`/properties/${p.id}`}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[11px] font-medium"
                            >
                              <Calendar className="h-3 w-3 text-[#3B82F6]" /> Book Visit
                            </Link>

                            <Link
                              href={`/properties/compare?ids=${p.id}`}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[11px] font-medium"
                            >
                              <Scale className="h-3 w-3 text-[#8B5CF6]" /> Compare
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleFavoriteToggle(p.id)}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[11px] font-medium"
                            >
                              <Heart className="h-3 w-3 text-[#EF4444]" /> Save
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareProperty(p.id, p.title)}
                              className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[11px] font-medium"
                            >
                              <Share2 className="h-3 w-3 text-[#06B6D4]" /> Share
                            </button>

                            <button
                              type="button"
                              onClick={() => sendMessage(`Tell me more details about "${p.title}" in ${p.city}`)}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1 bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] hover:bg-[#CFFAFE] rounded-xl text-[11px] font-semibold"
                            >
                              <Sparkles className="h-3 w-3 text-[#0891B2]" /> Ask AI About This Property
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
                <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl rounded-tl-sm shadow-sm p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#06B6D4]" />
                  <span className="text-sm text-[#64748B]">Searching the database...</span>
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
                  className="text-xs bg-[#F8FAFC] text-[#64748B] hover:text-[#059669] hover:border-[#10B981] border border-[#E2E8F0] px-3 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-[#E2E8F0] p-4 flex gap-3 bg-white">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about properties, prices, locations..."
                rows={1}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="lg" className="flex-shrink-0 bg-[#10B981] text-white hover:bg-[#059669] rounded-xl border-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Info note */}
        <p className="text-center text-xs text-[#94A3B8] mt-3">
          🔒 The AI only answers from real property data — no hallucinations. Powered by Gemini AI.
        </p>
      </div>
    </div>
  );
}
