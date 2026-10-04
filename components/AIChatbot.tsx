"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, X, Send, Loader2, Sparkles, MessageSquare, ChevronDown,
  Building2, ShieldCheck, User, RefreshCw, AlertCircle, MapPin,
  BedDouble, Bath, ExternalLink, Heart, Scale, Share2, Calendar, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
      "Show me properties in Mogadishu",
      "Find apartments under $50,000",
      "What real estate services do you provide?",
    ];
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = role === "ADMIN"
        ? `Hello Admin ${userName}! I can help you monitor pending approvals, platform stats, and revenue.`
        : role === "USER"
        ? `Hello Agent ${userName}! Ask me about your property listings, approval statuses, or inquiries.`
        : role === "CUSTOMER"
        ? `Welcome ${userName}! I can recommend properties based on your preferences or answer housing questions.`
        : `Welcome to AI Real Estate! Ask me anything about properties, locations, or price predictions in Somalia.`;

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);
    setError(null);

    try {
      // Send conversation history to preserve multi-turn memory
      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

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
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        properties: data.properties || [],
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

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-3.5 rounded-full shadow-2xl border border-[#334155] transition-all duration-300 hover:scale-105"
        >
          <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center shadow-sm text-white">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-semibold text-sm tracking-tight pr-1">Ask AI Assistant</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-4 ring-[#10B981]/20" />
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[450px] h-[620px] bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
                  AI Real Estate Assistant
                </h3>
                <span className="text-[10px] text-[#34D399] font-medium tracking-wide">
                  {role === "ADMIN" ? "Admin Mode" : role === "USER" ? "Manager Mode" : role === "CUSTOMER" ? "Customer Mode" : "Public Mode"} • Live Database
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#CBD5E1] hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2.5", msg.role === "user" ? "ml-auto flex-row-reverse max-w-[85%]" : "mr-auto max-w-[95%]")}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1 shadow-xs",
                    msg.role === "user" ? "bg-[#10B981] text-white" : "bg-[#0F172A] text-[#10B981]"
                  )}
                >
                  {msg.role === "user" ? "You" : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs",
                      msg.role === "user"
                        ? "bg-[#10B981] text-white rounded-tr-none font-medium"
                        : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-none whitespace-pre-wrap"
                    )}
                  >
                    {msg.content}
                    <span
                      className={cn(
                        "block text-[10px] mt-1.5 text-right font-normal",
                        msg.role === "user" ? "text-white/80" : "text-[#94A3B8]"
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
                          className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-sm space-y-3 hover:border-[#10B981] transition-colors"
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

                          {/* Complete Step 4 Specifications */}
                          <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F8FAFC] rounded-xl text-[10px] text-[#64748B] border border-[#E2E8F0]">
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

                          {/* Amenity Badges (Water, Power, Net, Pool, Security) */}
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

                          {/* Interactive Property Actions */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <Link
                              href={`/properties/${p.id}`}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold shadow-xs"
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
                              onClick={() => handleSend(`Tell me more details about "${p.title}" in ${p.city}`)}
                              className="col-span-2 inline-flex items-center justify-center gap-1 py-1 bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] hover:bg-[#CFFAFE] rounded-xl text-[11px] font-semibold"
                            >
                              <Sparkles className="h-3 w-3 text-[#0891B2]" /> Ask AI About This Property
                            </button>
                          </div>

                          {/* Similar Comps teaser */}
                          {p.similarProperties && p.similarProperties.length > 0 && (
                            <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                              <p className="font-semibold text-[#0F172A] mb-1">Similar in {p.city}:</p>
                              <div className="space-y-1">
                                {p.similarProperties.map((sim) => (
                                  <Link
                                    key={sim.id}
                                    href={`/properties/${sim.id}`}
                                    className="flex justify-between items-center hover:text-[#10B981] truncate"
                                  >
                                    <span className="truncate">↳ {sim.title}</span>
                                    <span className="font-bold text-[#059669] flex-shrink-0 ml-1">{sim.formattedPrice}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-3.5 py-2.5 rounded-xl w-max">
                <Loader2 className="h-4 w-4 animate-spin" /> AI Assistant is searching database...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-[#E2E8F0] overflow-x-auto whitespace-nowrap flex gap-2">
            {getSuggestions().map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={loading}
                className="text-[11px] bg-[#F1F5F9] hover:bg-[#10B981] hover:text-white text-[#334155] px-2.5 py-1 rounded-full border border-[#E2E8F0] transition-colors flex-shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI about properties, prices..."
              className="h-10 text-xs sm:text-sm border-[#E2E8F0] rounded-xl focus:border-[#10B981] focus:ring-[#10B981]/20 bg-[#F8FAFC]"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 p-0 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
