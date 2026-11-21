// ================================================================
// COMPONENT  : AIChatbot
// BRAND      : Kiro-Maal Real Estate
// PALETTE    : Deep Navy (#07111F), Luxury Gold (#C89B3C), Cream (#F7F3EA)
// DESCRIPTION: Master AI Assistant with ChatGPT-style recent history,
//              full grounding engine, live database query, and luxury branding
// ================================================================
"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
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
  SquareStack,
  Eye,
  Heart,
  Share2,
  AlertCircle,
  ChevronRight,
  History,
  SquarePen,
  Trash2,
  Search,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { GroundedPropertyResult } from "@/lib/ai/conversation/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  properties?: GroundedPropertyResult[];
}

interface RecentSessionItem {
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
  source?: "db" | "local";
  messages?: Message[];
}

function buildWelcomeMessage(role: string, userName: string): Message {
  const welcomeText =
    role === "ADMIN"
      ? `Hello Admin ${userName}! I can help you monitor pending approvals, platform stats, and revenue.`
      : role === "USER"
      ? `Hello Agent ${userName}! Ask me about your property listings, approval statuses, or inquiries.`
      : role === "CUSTOMER"
      ? `Welcome ${userName}! I can recommend properties based on your preferences or answer housing questions.`
      : `Welcome to Kiro-Maal Real Estate! Ask me anything about properties, locations, or price predictions in Somalia.`;
  return {
    id: "welcome",
    role: "assistant",
    content: welcomeText,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatShortRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Recent";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── MEMOIZED CHAT PROPERTY CARD SUB-COMPONENT ────────────────────
const ChatPropertyCard = memo(function ChatPropertyCard({
  property: p,
  onFavoriteToggle,
  onShareProperty,
}: {
  property: GroundedPropertyResult;
  onFavoriteToggle: (id: string) => void;
  onShareProperty: (id: string, title: string) => void;
}) {
  return (
    <div className="bg-white border border-[#E8E1D4] rounded-2xl p-3.5 shadow-xs space-y-3 hover:border-[#C89B3C] transition-colors">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#E8E1D4] relative">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.title}
              fill
              sizes="80px"
              className="object-cover"
              loading="lazy"
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
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.statusColor}`}>
              {p.statusEmoji}
            </span>
            <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FBF7EE] px-1.5 py-0.5 rounded border border-[#E8DCC2]">
              ★ {typeof p.aiMatchScore === "number" && !isNaN(p.aiMatchScore) && p.aiMatchScore > 0 ? p.aiMatchScore : 95}% Match
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
      {String(p.type || "").toUpperCase() === "LAND" ||
      String(p.typeLabel || "").toUpperCase() === "LAND" ||
      p.bedrooms === 0 ? (
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[11px] font-semibold text-[#07111F] border border-[#E8E1D4]">
          <SquareStack className="h-3.5 w-3.5 text-[#C89B3C]" />
          <span className="inline-flex items-center gap-1">
            <span>
              {String(p.type || "").toUpperCase() === "LAND" || String(p.typeLabel || "").toUpperCase() === "LAND"
                ? "Land Plot Area:"
                : "Total Usable Area:"}
            </span>
            <strong className="font-bold">{`${p.areaSize || (p as any).area || (p as any).landSize || 400} m²`}</strong>
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[10px] text-slate-700 border border-[#E8E1D4]">
          <span className="flex items-center gap-1 truncate">
            <BedDouble className="h-3 w-3 text-[#C89B3C]" />
            <span>{`${p.bedrooms} Beds`}</span>
          </span>
          <span className="flex items-center gap-1 truncate">
            <Bath className="h-3 w-3 text-[#C89B3C]" />
            <span>{`${p.bathrooms} Baths`}</span>
          </span>
          <span className="truncate">{`${p.areaSize || (p as any).area} m²`}</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <Link
          href={`/properties/${p.id}`}
          className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#C89B3C] hover:bg-[#B88924] text-[#07111F] rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Details
        </Link>
        <button
          type="button"
          onClick={() => onFavoriteToggle(p.id)}
          className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
        >
          <Heart className="h-3 w-3 text-rose-500" /> Save
        </button>
        <button
          type="button"
          onClick={() => onShareProperty(p.id, p.title)}
          className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
        >
          <Share2 className="h-3 w-3 text-[#C89B3C]" /> Share
        </button>
      </div>
    </div>
  );
});

export default function AIChatbot() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSessionItem[]>([]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const role = session?.user?.role || "PUBLIC";
  const userId = session?.user?.id || "guest";
  const userName = session?.user?.name || "Guest";
  const storageKey = `kiromaal_ai_chats_${userId}`;

  const [messages, setMessages] = useState<Message[]>(() => [
    buildWelcomeMessage(role, userName),
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep welcome message synced with authenticated user info if still on initial screen
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [buildWelcomeMessage(role, userName)];
      }
      return prev;
    });
  }, [role, userName]);

  // Read cached local sessions helper
  const readLocalSessions = useCallback((): RecentSessionItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const writeLocalSessions = useCallback(
    (items: RecentSessionItem[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 30)));
      } catch {
        // Ignore storage quota errors
      }
    },
    [storageKey]
  );

  // Sync recent conversations from DB + localStorage when opened
  const loadRecentSessions = useCallback(async () => {
    const localItems = readLocalSessions();
    setRecentSessions(localItems);

    if (!session?.user?.id) return;

    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-chat?list=true");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        const dbItems: RecentSessionItem[] = data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title || "Conversation",
          lastMessage: s.lastMessage || "",
          messageCount: s.messageCount || 0,
          updatedAt: s.updatedAt || s.createdAt,
          source: "db",
        }));

        // Merge DB sessions with any local-only sessions (preserving cached messages)
        const localMap = new Map(localItems.map((l) => [l.id, l]));
        const mergedMap = new Map<string, RecentSessionItem>();

        for (const dbItem of dbItems) {
          const cached = localMap.get(dbItem.id);
          mergedMap.set(dbItem.id, {
            ...dbItem,
            messages: cached?.messages,
          });
        }
        for (const localItem of localItems) {
          if (!mergedMap.has(localItem.id)) {
            mergedMap.set(localItem.id, localItem);
          }
        }

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setRecentSessions(merged);
        writeLocalSessions(merged);
      }
    } catch {
      // Fall back silently to local sessions
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.user?.id, readLocalSessions, writeLocalSessions]);

  useEffect(() => {
    if (isOpen) {
      loadRecentSessions();
    }
  }, [isOpen, loadRecentSessions]);

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

  // Memoized role-aware suggestions
  const suggestions = useMemo(() => {
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
  }, [role]);

  useEffect(() => {
    if (isOpen && !showHistory) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, showHistory]);

  // Save current conversation snapshot into recentSessions & localStorage
  const upsertLocalSession = useCallback(
    (activeId: string, updatedMessages: Message[]) => {
      const nonWelcome = updatedMessages.filter((m) => m.id !== "welcome");
      if (nonWelcome.length === 0) return;
      const firstUserMsg = nonWelcome.find((m) => m.role === "user");
      const lastMsg = nonWelcome[nonWelcome.length - 1];
      const title = (firstUserMsg?.content || "New Conversation").slice(0, 52).trim();

      setRecentSessions((prev) => {
        const existing = prev.find((s) => s.id === activeId);
        const nextItem: RecentSessionItem = {
          id: activeId,
          title: existing?.title && existing.title !== "New Conversation" ? existing.title : title,
          lastMessage: lastMsg?.content || "",
          messageCount: nonWelcome.length,
          updatedAt: new Date().toISOString(),
          source: session?.user?.id ? "db" : "local",
          messages: updatedMessages,
        };
        const filtered = prev.filter((s) => s.id !== activeId);
        const nextList = [nextItem, ...filtered].slice(0, 30);
        writeLocalSessions(nextList);
        return nextList;
      });
    },
    [session?.user?.id, writeLocalSessions]
  );

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setConversationState(null);
    setError(null);
    setMessages([buildWelcomeMessage(role, userName)]);
    setShowHistory(false);
  }, [role, userName]);

  const handleSelectSession = useCallback(
    async (item: RecentSessionItem) => {
      setError(null);
      setSessionId(item.id);
      setConversationState(null);

      // Show cached messages immediately if present
      if (item.messages && item.messages.length > 0) {
        setMessages(item.messages);
        setShowHistory(false);
      }

      // If logged in & DB session, fetch latest persisted messages from server
      if (session?.user?.id && !item.id.startsWith("session_")) {
        setLoadingSessionId(item.id);
        try {
          const res = await fetch(`/api/ai-chat?sessionId=${encodeURIComponent(item.id)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.session?.messages?.length > 0) {
              const loadedMsgs: Message[] = data.session.messages.map((m: any) => ({
                id: m.id,
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }));
              setMessages(loadedMsgs);
              upsertLocalSession(item.id, loadedMsgs);
            }
          }
        } catch {
          // Keep cached messages
        } finally {
          setLoadingSessionId(null);
          setShowHistory(false);
        }
      } else {
        setShowHistory(false);
      }
    },
    [session?.user?.id, upsertLocalSession]
  );

  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, idToDelete: string) => {
      e.stopPropagation();

      setRecentSessions((prev) => {
        const next = prev.filter((s) => s.id !== idToDelete);
        writeLocalSessions(next);
        return next;
      });

      if (sessionId === idToDelete) {
        handleNewChat();
      }

      if (session?.user?.id && !idToDelete.startsWith("session_")) {
        try {
          await fetch(`/api/ai-chat?sessionId=${encodeURIComponent(idToDelete)}`, {
            method: "DELETE",
          });
        } catch {
          // Ignore network errors
        }
      }
    },
    [sessionId, session?.user?.id, writeLocalSessions, handleNewChat]
  );

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

    const nextWithUser = [...messages, userMsg];
    setMessages(nextWithUser);
    if (!textToSend) setInput("");
    setLoading(true);
    setError(null);
    setShowHistory(false);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          sessionId,
          history: chatHistory,
          conversationState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Too many requests. Please wait a moment before asking again.");
          return;
        }
        throw new Error(data.error || "Failed to get response");
      }

      const resolvedSessionId = data.sessionId || sessionId || `session_${Date.now()}`;
      if (resolvedSessionId !== sessionId) {
        setSessionId(resolvedSessionId);
      }
      if (data.conversationState) {
        setConversationState(data.conversationState);
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

      const finalMessages = [...nextWithUser, botMsg];
      setMessages(finalMessages);
      upsertLocalSession(resolvedSessionId, finalMessages);
    } catch {
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

  const filteredSessions = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return recentSessions;
    return recentSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q)
    );
  }, [recentSessions, historySearch]);

  // Do not render floating chatbot button over authentication forms
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {/* ─── Floating Trigger Pill Button ─── */}
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
        <div className="w-[94vw] sm:w-[430px] md:w-[460px] h-[630px] max-h-[86vh] bg-[#FCFBF7] rounded-[32px] shadow-[0_25px_70px_rgba(7,17,31,0.4)] border border-[#C89B3C]/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 relative gpu-accelerated will-change-[transform,opacity]">
          {/* ─── Top Header with Deep Navy & Gold Accents ─── */}
          <div className="relative bg-[#07111F] text-white px-4 py-3.5 flex items-center justify-between overflow-hidden shrink-0 border-b border-[#C89B3C]/30">
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
              <Image
                src="/images/luxury_villa_twilight.jpg"
                alt="Twilight Villa"
                fill
                className="object-cover object-right"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#07111F] via-[#0B1728]/95 to-[#07111F]/80" />

            {/* Left Header: History Toggle + Bot Badge & Title */}
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                title="Recent Chats"
                className={cn(
                  "relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0",
                  showHistory
                    ? "bg-[#C89B3C] border-[#D9B45B] text-[#07111F]"
                    : "bg-white/10 hover:bg-white/20 border-white/15 text-[#D9B45B]"
                )}
                aria-label="Toggle Recent Chats"
              >
                <History className="w-4 h-4" />
                {recentSessions.length > 0 && !showHistory && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#C89B3C] text-[#07111F] text-[9px] font-black flex items-center justify-center">
                    {recentSessions.length > 9 ? "9+" : recentSessions.length}
                  </span>
                )}
              </button>

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#A97918] flex items-center justify-center text-[#07111F] shadow-md shadow-black/40 shrink-0 font-bold">
                <Bot className="w-5 h-5 text-[#07111F]" />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-[14px] text-white tracking-tight leading-snug truncate">
                  Kiro-Maal AI Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse shrink-0" />
                  <span className="text-[11px] text-[#D9B45B] font-semibold tracking-wide truncate">
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

            {/* Right Header: New Chat + Close */}
            <div className="relative z-10 flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleNewChat}
                title="New Chat"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[#D9B45B] hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                aria-label="Start New Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Main Body: Chat Area + ChatGPT-style Recent Chats Drawer ─── */}
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Slide-over Recent Chats Panel */}
            {showHistory && (
              <div className="absolute inset-0 z-30 bg-[#FCFBF7] flex flex-col animate-in fade-in slide-in-from-left-4 duration-150">
                <div className="p-4 border-b border-[#E8E1D4] bg-[#F7F3EA] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-[#C89B3C]" />
                      <h4 className="font-serif font-bold text-sm text-[#07111F]">
                        Recent Conversations
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B]">
                        {recentSessions.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold shadow-xs hover:brightness-105 cursor-pointer"
                    >
                      <SquarePen className="w-3.5 h-3.5" /> New Chat
                    </button>
                  </div>

                  {recentSessions.length > 0 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#C89B3C] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search what you asked before..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E8E1D4] text-xs text-[#07111F] placeholder:text-slate-400 focus:outline-none focus:border-[#C89B3C]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 momentum-scroll">
                  {loadingHistory && recentSessions.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#6B7280]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#C89B3C]" />
                      <span>Loading your recent chats...</span>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="py-14 px-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto">
                        <MessageSquare className="w-5 h-5 opacity-80" />
                      </div>
                      <p className="font-serif font-bold text-sm text-[#07111F]">
                        {recentSessions.length === 0
                          ? "No recent conversations yet"
                          : "No matching conversations"}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {recentSessions.length === 0
                          ? "Ask the AI Assistant a question and your chat history will appear here."
                          : "Try another search keyword."}
                      </p>
                    </div>
                  ) : (
                    filteredSessions.map((item) => {
                      const isCurrent = sessionId === item.id;
                      const isLoadingThis = loadingSessionId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSession(item)}
                          className={cn(
                            "group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5",
                            isCurrent
                              ? "bg-[#07111F] border-[#C89B3C] text-white shadow-sm"
                              : "bg-white border-[#E8E1D4] hover:border-[#C89B3C]/60 hover:bg-[#FBF7EE] text-[#07111F]"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isLoadingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C89B3C] shrink-0" />
                              ) : (
                                <MessageSquare
                                  className={cn(
                                    "w-3.5 h-3.5 shrink-0",
                                    isCurrent ? "text-[#D9B45B]" : "text-[#C89B3C]"
                                  )}
                                />
                              )}
                              <p
                                className={cn(
                                  "text-xs font-bold truncate",
                                  isCurrent ? "text-white" : "text-[#07111F]"
                                )}
                              >
                                {item.title}
                              </p>
                            </div>
                            {item.lastMessage && (
                              <p
                                className={cn(
                                  "text-[11px] truncate mt-1 pl-5",
                                  isCurrent ? "text-slate-300" : "text-[#6B7280]"
                                )}
                              >
                                {item.lastMessage}
                              </p>
                            )}
                            <div
                              className={cn(
                                "flex items-center gap-2 mt-1.5 pl-5 text-[10px]",
                                isCurrent ? "text-[#D9B45B]" : "text-[#9CA3AF]"
                              )}
                            >
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatShortRelativeDate(item.updatedAt)}
                              </span>
                              <span>•</span>
                              <span>{item.messageCount} msgs</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, item.id)}
                            title="Delete conversation"
                            className={cn(
                              "p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer",
                              isCurrent
                                ? "text-slate-400 hover:text-rose-400 hover:bg-white/10"
                                : "text-slate-400 opacity-70 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50"
                            )}
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-[#E8E1D4] bg-[#F7F3EA] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E1D4] text-xs font-bold text-[#07111F] hover:border-[#C89B3C] cursor-pointer"
                  >
                    Back to Chat
                  </button>
                </div>
              </div>
            )}

            {/* ─── Chat Messages Area ─── */}
            <div className="relative flex-1 p-4 sm:p-5 overflow-y-auto momentum-scroll space-y-4 bg-gradient-to-b from-[#F7F3EA]/90 via-[#FCFBF7] to-[#F7F3EA]/90">
              {/* Quick Recent Bar when on fresh chat and history exists */}
              {messages.length === 1 &&
                messages[0].id === "welcome" &&
                recentSessions.length > 0 && (
                  <div className="bg-white/90 border border-[#E8E1D4] rounded-2xl p-3 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] flex items-center gap-1.5">
                        <History className="w-3 h-3 text-[#C89B3C]" /> Recently Asked
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="text-[10px] font-bold text-[#07111F] hover:text-[#C89B3C] cursor-pointer"
                      >
                        View all ({recentSessions.length}) →
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {recentSessions.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSession(item)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl bg-[#F7F3EA]/70 hover:bg-[#FBF7EE] border border-transparent hover:border-[#C89B3C]/40 flex items-center justify-between gap-2 transition-all cursor-pointer"
                        >
                          <span className="text-xs font-medium text-[#07111F] truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[#6B7280] shrink-0">
                            {formatShortRelativeDate(item.updatedAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                            <ChatPropertyCard
                              key={p.id}
                              property={p}
                              onFavoriteToggle={handleFavoriteToggle}
                              onShareProperty={handleShareProperty}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2.5 text-xs text-[#07111F] bg-[#FBF7EE] border border-[#E8DCC2] px-3.5 py-2.5 rounded-2xl w-max shadow-2xs">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" />
                    <span className="font-medium text-slate-700">AIDA is thinking...</span>
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
          </div>

          {/* ─── Quick Suggested Action Pills ─── */}
          <div className="relative z-10 px-4 pt-2 pb-1.5 bg-[#F7F3EA] flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((sug, i) => (
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
              <div className="pl-2.5 text-slate-400 shrink-0">
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI about properties, prices..."
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#07111F] placeholder:text-slate-400 py-1.5 px-1 focus:ring-0"
              />

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
