// ================================================================
// COMPONENT  : ManagerInquiriesClient
// DESCRIPTION: Shared conversation hub for Manager & Admin portals:
//              - Live shared customer inquiries (Customer <-> Manager <-> Admin)
//              - Direct Admin <-> Manager internal conversations
//              - Public contact form submissions (Admin portal)
// ================================================================
"use client";

import { useState, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Shield,
  Phone,
  Mail,
  Plus,
  X,
  Users,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { parseInquiryThread } from "@/lib/inquiry-thread";

export interface CounterpartUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ContactMsgItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ManagerInquiriesClientProps {
  initialInquiries?: any[];
  portalRole?: "ADMIN" | "USER";
  currentUserId?: string;
  counterparts?: CounterpartUser[];
  contactMessages?: ContactMsgItem[];
}

type TabKey = "ALL" | "DIRECT" | "CUSTOMERS" | "CONTACT_FORM";

function isDirectAdminManagerThread(inq: any): boolean {
  return inq?.customer?.role === "ADMIN";
}

function ManagerInquiriesClient({
  initialInquiries = [],
  portalRole = "USER",
  counterparts = [],
  contactMessages = [],
}: ManagerInquiriesClientProps) {
  const isAdmin = portalRole === "ADMIN";
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");

  // New Direct Admin <-> Manager Conversation Composer
  const [showNewComposer, setShowNewComposer] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    counterparts[0]?.id || ""
  );
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);

  // Per-card inline reply draft
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateDirectThread = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;

      setCreatingThread(true);
      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: selectedRecipientId || undefined,
            subject: newSubject.trim() || "Admin ↔ Manager Coordination",
            message: newMessage.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.inquiry) {
          setInquiries((prev) => [data.inquiry, ...prev]);
          setNewSubject("");
          setNewMessage("");
          setShowNewComposer(false);
          setActiveTab("DIRECT");
          toast({
            title: "Conversation Started 💬",
            description: isAdmin
              ? "Your direct message has been delivered to the Property Manager."
              : "Your direct message has been delivered to the Super Admin.",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Could not start conversation.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
      } finally {
        setCreatingThread(false);
      }
    },
    [selectedRecipientId, newSubject, newMessage, isAdmin]
  );

  const handleSendReply = useCallback(
    async (inquiryId: string) => {
      const text = (inlineDrafts[inquiryId] || "").trim();
      if (!text) return;

      setSendingId(inquiryId);
      try {
        const res = await fetch("/api/inquiries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiryId,
            response: text,
            status: "RESPONDED",
          }),
        });
        const data = await res.json();
        if (data.success && data.inquiry) {
          setInquiries((prev) =>
            prev.map((item) => (item.id === inquiryId ? data.inquiry : item))
          );
          setInlineDrafts((prev) => ({ ...prev, [inquiryId]: "" }));
          toast({
            title: "Reply Sent! 📩",
            description: "Your message has been added to the shared conversation.",
          });
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to send reply.",
          variant: "destructive",
        });
      } finally {
        setSendingId(null);
      }
    },
    [inlineDrafts]
  );

  const counts = useMemo(() => {
    let direct = 0;
    let customers = 0;
    for (const inq of inquiries) {
      if (isDirectAdminManagerThread(inq)) direct++;
      else customers++;
    }
    return {
      all: inquiries.length,
      direct,
      customers,
      contactForm: contactMessages.length,
    };
  }, [inquiries, contactMessages]);

  const displayedInquiries = useMemo(() => {
    if (activeTab === "DIRECT") {
      return inquiries.filter(isDirectAdminManagerThread);
    }
    if (activeTab === "CUSTOMERS") {
      return inquiries.filter((i) => !isDirectAdminManagerThread(i));
    }
    return inquiries;
  }, [inquiries, activeTab]);

  return (
    <div
      className={
        isAdmin
          ? "space-y-6 w-full min-w-0"
          : "space-y-6 max-w-5xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7"
      }
    >
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />{" "}
            {isAdmin
              ? "Shared Communications Hub"
              : "Direct Buyer & Admin Communications"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#C89B3C]" />{" "}
            {isAdmin
              ? "Shared Conversations & Inquiries"
              : "Messages & Shared Conversations"}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {isAdmin
              ? "Collaborate directly with Property Managers and participate in live customer inquiry threads."
              : "Live two-way conversations with customers and direct coordination with Super Admin."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => setShowNewComposer((v) => !v)}
            className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 text-xs font-bold gap-1.5 border-0 shadow-xs cursor-pointer"
          >
            {showNewComposer ? (
              <>
                <X className="h-3.5 w-3.5" /> Close Composer
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />{" "}
                {isAdmin ? "Message Manager" : "Message Admin"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInquiries}
            disabled={loading}
            className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#C89B3C] ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── New Admin <-> Manager Direct Message Composer ─── */}
      {showNewComposer && (
        <form
          onSubmit={handleCreateDirectThread}
          className="bg-[#FCFBF7] rounded-2xl border-2 border-[#C89B3C]/50 shadow-md overflow-hidden"
        >
          <div className="bg-[#07111F] px-5 py-3.5 flex items-center justify-between border-b border-[#C89B3C]/30">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-[#C89B3C]/20 border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-white">
                  {isAdmin
                    ? "Start Direct Conversation with Property Manager"
                    : "Start Direct Conversation with Super Admin"}
                </h2>
                <p className="text-[11px] text-slate-300">
                  Private real-time thread synced across both Admin and Manager portals
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNewComposer(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {counterparts.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    {isAdmin ? "Select Property Manager" : "Select Administrator"}
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-xs sm:text-sm text-[#07111F] font-medium focus:outline-none focus:border-[#C89B3C]"
                  >
                    {counterparts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={counterparts.length > 0 ? "" : "sm:col-span-2"}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Subject
                </label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Property Approval Follow-up, Client Escalation..."
                  className="h-10 rounded-xl border-[#E8E1D4] bg-white text-xs sm:text-sm text-[#07111F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Message
              </label>
              <textarea
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isAdmin
                    ? "Write your message to the Property Manager..."
                    : "Write your message to the Super Admin..."
                }
                required
                className="w-full p-3 rounded-xl border border-[#E8E1D4] bg-white text-xs sm:text-sm text-[#07111F] focus:outline-none focus:border-[#C89B3C] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewComposer(false)}
                className="rounded-xl border-[#E8E1D4] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingThread || !newMessage.trim()}
                className="rounded-xl bg-[#07111F] text-[#D9B45B] hover:bg-[#0D1E35] border border-[#C89B3C]/40 text-xs font-bold gap-1.5 cursor-pointer"
              >
                {creatingThread ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Direct Message
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ─── Filter Tabs ─── */}
      <div className="flex flex-wrap items-center gap-2 bg-[#FCFBF7] p-2 rounded-2xl border border-[#E8E1D4] shadow-xs">
        {(
          [
            { key: "ALL", label: "All Shared Threads", count: counts.all },
            { key: "DIRECT", label: "Admin ↔ Manager Chat", count: counts.direct },
            { key: "CUSTOMERS", label: "Customer Inquiries", count: counts.customers },
            ...(isAdmin && counts.contactForm > 0
              ? [{ key: "CONTACT_FORM", label: "Public Contact Form", count: counts.contactForm }]
              : []),
          ] as { key: TabKey; label: string; count: number }[]
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                active
                  ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                  : "text-[#4B5563] hover:text-[#07111F] hover:bg-[#F7F3EA]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  active ? "bg-[#C89B3C]/25 text-[#D9B45B]" : "bg-[#F7F3EA] text-[#6B7280]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Public Contact Form Tab (Admin) ─── */}
      {activeTab === "CONTACT_FORM" ? (
        <div className="space-y-4">
          {contactMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-serif font-bold text-[#07111F] text-base">
                    {msg.name}
                  </h3>
                  <p className="text-xs text-[#A97918] font-bold mt-0.5 uppercase tracking-wide">
                    {msg.subject}
                  </p>
                </div>
                <span className="text-xs text-[#6B7280] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#C89B3C]" />
                  {new Date(msg.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-[#4B5563] text-sm leading-relaxed mb-4">{msg.message}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E1D4] text-xs">
                <a
                  href={`mailto:${msg.email}`}
                  className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-[#07111F] font-medium"
                >
                  <Mail className="h-3.5 w-3.5 text-[#C89B3C]" /> {msg.email}
                </a>
                <a
                  href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                  className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-4 py-1.5 rounded-xl text-xs font-bold"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">
            Loading Shared Conversations...
          </p>
        </div>
      ) : displayedInquiries.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Inbox className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">
            {activeTab === "DIRECT"
              ? "No Admin ↔ Manager conversations yet"
              : "No conversations recorded yet"}
          </h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            {activeTab === "DIRECT"
              ? `Click "${isAdmin ? "Message Manager" : "Message Admin"}" above to start a live internal thread.`
              : "Customer inquiries and shared Admin–Manager conversations will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedInquiries.map((inq) => {
            const isDirect = isDirectAdminManagerThread(inq);
            const thread = parseInquiryThread(inq);
            const lastTurn = thread[thread.length - 1];
            const needsReply = isDirect
              ? (isAdmin && lastTurn?.sender === "MANAGER") ||
                (!isAdmin && lastTurn?.sender === "ADMIN")
              : lastTurn?.sender === "CUSTOMER";

            const customerName = inq.customer?.name || inq.name || "Customer";
            const customerEmail = inq.customer?.email || inq.email || "";
            const customerPhone = inq.customer?.phone || inq.phone || "";
            const managerName = inq.manager?.name || "Property Manager";

            return (
              <div
                key={inq.id}
                className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden hover:border-[#C89B3C]/50 transition-all"
              >
                {/* ─── Smart Card Top Header ─── */}
                <div className="bg-gradient-to-r from-[#07111F] via-[#0B1728] to-[#07111F] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C89B3C]/30">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isDirect ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 inline-flex items-center gap-1">
                          <Users className="w-3 h-3" /> Admin ↔ Manager Direct
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-[#C89B3C]/20 text-[#D9B45B] border border-[#C89B3C]/30">
                          Shared Customer Thread
                        </span>
                      )}

                      <span className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                        {inq.subject || "Property Inquiry"}
                      </span>
                    </div>

                    {!isDirect && inq.property && (
                      <Link
                        href={`/properties/${inq.property.id}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-200 hover:text-[#D9B45B] transition-colors mt-1"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[#D9B45B]" />
                        {inq.property.title} ({inq.property.city} •{" "}
                        <span className="text-[#D9B45B] font-semibold">
                          {formatPrice(inq.property.price)}
                        </span>
                        )
                      </Link>
                    )}

                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1.5">
                      {isDirect ? (
                        <>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#D9B45B]">
                            <Shield className="h-3.5 w-3.5" /> Admin: {customerName}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-white">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Manager:{" "}
                            {managerName}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 font-semibold text-white">
                            <User className="h-3.5 w-3.5 text-[#D9B45B]" /> {customerName}
                          </span>
                          {customerEmail && (
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <Mail className="h-3 w-3 text-[#D9B45B]" /> {customerEmail}
                            </span>
                          )}
                          {customerPhone && (
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <Phone className="h-3 w-3 text-[#D9B45B]" /> {customerPhone}
                            </span>
                          )}
                          {inq.manager?.name && (
                            <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                              <ShieldCheck className="h-3 w-3" /> Assigned: {inq.manager.name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        needsReply
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      }`}
                    >
                      {needsReply ? (
                        <>
                          <Clock className="h-3.5 w-3.5" /> Needs Reply
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* ─── Chronological Shared Chat Thread ─── */}
                <div className="p-5 sm:p-6 bg-[#FAF7F2] space-y-4 max-h-[460px] overflow-y-auto">
                  {thread.map((msg, idx) => {
                    const isCustomer = msg.sender === "CUSTOMER";
                    const isAdminMsg = msg.sender === "ADMIN";
                    const isRightSide = isDirect
                      ? isAdmin
                        ? isAdminMsg
                        : !isAdminMsg
                      : !isCustomer;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex items-start gap-3 ${
                          isRightSide ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isRightSide && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-1 border ${
                              isAdminMsg
                                ? "bg-emerald-900 border-emerald-400 text-emerald-200"
                                : isCustomer
                                ? "bg-[#C89B3C]/20 border-[#C89B3C]/40 text-[#A97918]"
                                : "bg-[#07111F] border-[#C89B3C] text-[#D9B45B]"
                            }`}
                          >
                            {isAdminMsg ? (
                              <Shield className="h-4 w-4" />
                            ) : isCustomer ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-xs ${
                            isAdminMsg
                              ? "bg-gradient-to-br from-[#0B2239] to-[#07111F] border border-emerald-400/40 text-white"
                              : isCustomer
                              ? "bg-white border border-[#E8E1D4] text-[#07111F]"
                              : "bg-[#07111F] border border-[#C89B3C]/40 text-white"
                          } ${isRightSide ? "rounded-tr-xs" : "rounded-tl-xs"}`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                isAdminMsg
                                  ? "text-emerald-300"
                                  : isCustomer
                                  ? "text-[#A97918]"
                                  : "text-[#D9B45B]"
                              }`}
                            >
                              {isAdminMsg ? (
                                <>
                                  <Shield className="h-3.5 w-3.5" /> {msg.senderName} • Super Admin
                                </>
                              ) : isCustomer ? (
                                <>{msg.senderName || customerName} • Customer</>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#D9B45B]" />{" "}
                                  {msg.senderName} • Manager
                                </>
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-mono ${
                                isCustomer ? "text-[#6B7280]" : "text-slate-400"
                              }`}
                            >
                              {msg.timestamp}
                            </span>
                          </div>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                              isCustomer ? "text-[#07111F]" : "text-[#F7F3EA]"
                            }`}
                          >
                            {msg.text}
                          </p>
                        </div>

                        {isRightSide && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-xs border ${
                              isAdminMsg
                                ? "bg-emerald-900 border-emerald-400 text-emerald-200"
                                : "bg-[#07111F] border-[#C89B3C] text-[#D9B45B]"
                            }`}
                          >
                            {isAdminMsg ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ─── Bottom Inline Reply Composer ─── */}
                <div className="p-3.5 sm:p-4 bg-[#FCFBF7] border-t border-[#E8E1D4] flex items-center gap-2.5">
                  <Input
                    value={inlineDrafts[inq.id] || ""}
                    onChange={(e) =>
                      setInlineDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(inq.id);
                      }
                    }}
                    placeholder={
                      isDirect
                        ? `Reply to ${isAdmin ? managerName : customerName}...`
                        : `Reply in shared thread with ${customerName}...`
                    }
                    className="flex-1 h-10 rounded-xl border-[#E8E1D4] bg-white text-xs sm:text-sm text-[#07111F] focus:border-[#C89B3C]"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendReply(inq.id)}
                    disabled={sendingId === inq.id || !(inlineDrafts[inq.id] || "").trim()}
                    className="h-10 px-4 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0 shadow-xs cursor-pointer shrink-0"
                  >
                    {sendingId === inq.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(ManagerInquiriesClient);
