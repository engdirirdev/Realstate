// ================================================================
// COMPONENT  : ManagerInquiriesClient
// DESCRIPTION: Manager smart conversation inbox for customer messages
// ================================================================
"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  MapPin,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { parseInquiryThread } from "@/lib/inquiry-thread";

interface ManagerInquiriesClientProps {
  initialInquiries?: any[];
}

function ManagerInquiriesClient({ initialInquiries = [] }: ManagerInquiriesClientProps) {
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [loading, setLoading] = useState(false);

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
      toast({ title: "Error", description: "Failed to load inquiries.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

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
            description: "Your reply has been added to the conversation thread.",
          });
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
      } finally {
        setSendingId(null);
      }
    },
    [inlineDrafts]
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Direct Buyer Communications
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> Customer Messages &amp; Inquiries
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Live two-way conversations with customers regarding your property listings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchInquiries}
          disabled={loading}
          className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white text-xs font-bold gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#C89B3C] ${loading ? "animate-spin" : ""}`} />
          Refresh Inbox
        </Button>
      </div>

      {loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">
            Loading Customer Conversations...
          </p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <MessageSquare className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No customer messages yet</h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            When customers send you a message or ask about a property, their messages will appear here so you can reply directly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {inquiries.map((inq) => {
            const thread = parseInquiryThread(inq);
            const lastTurn = thread[thread.length - 1];
            const needsReply = lastTurn?.sender === "CUSTOMER";
            const customerName = inq.customer?.name || inq.name || "Customer";
            const customerEmail = inq.customer?.email || inq.email || "";
            const customerPhone = inq.customer?.phone || inq.phone || "";

            return (
              <div
                key={inq.id}
                className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden hover:border-[#C89B3C]/50 transition-all"
              >
                {/* ─── Smart Card Top Header ─── */}
                <div className="bg-gradient-to-r from-[#07111F] via-[#0B1728] to-[#07111F] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C89B3C]/30">
                  <div className="flex items-center gap-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#C89B3C]/20 text-[#D9B45B] border border-[#C89B3C]/30">
                          {inq.subject || "Property Inquiry"}
                        </span>
                        {inq.property && (
                          <Link
                            href={`/properties/${inq.property.id}`}
                            className="inline-flex items-center gap-1 text-xs font-serif font-bold text-white hover:text-[#D9B45B] transition-colors"
                          >
                            <MapPin className="h-3.5 w-3.5 text-[#D9B45B]" />
                            {inq.property.title} ({inq.property.city} •{" "}
                            <span className="text-[#D9B45B]">{formatPrice(inq.property.price)}</span>)
                          </Link>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1">
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
                      </div>
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
                          <CheckCircle2 className="h-3.5 w-3.5" /> Replied
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* ─── Chronological Two-Sided Chat Thread ─── */}
                <div className="p-5 sm:p-6 bg-[#FAF7F2] space-y-4 max-h-[460px] overflow-y-auto">
                  {thread.map((msg, idx) => {
                    const isCustomer = msg.sender === "CUSTOMER";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex items-start gap-3 ${
                          isCustomer ? "justify-start" : "justify-end"
                        }`}
                      >
                        {/* Left Avatar for Customer */}
                        {isCustomer && (
                          <div className="w-8 h-8 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/40 text-[#07111F] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                            <User className="h-4 w-4 text-[#A97918]" />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-xs ${
                            isCustomer
                              ? "bg-white border border-[#E8E1D4] text-[#07111F] rounded-tl-xs"
                              : "bg-[#07111F] border border-[#C89B3C]/40 text-white rounded-tr-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                isCustomer ? "text-[#A97918]" : "text-[#D9B45B]"
                              }`}
                            >
                              {isCustomer ? (
                                <>{customerName} • Customer</>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#D9B45B]" /> You (
                                  {msg.senderName}) • Manager
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

                        {/* Right Avatar for Manager */}
                        {!isCustomer && (
                          <div className="w-8 h-8 rounded-full bg-[#07111F] border border-[#C89B3C] text-[#D9B45B] flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-xs">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ─── Smart Card Bottom Inline Reply Composer ─── */}
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
                    placeholder={`Write a reply to ${customerName}...`}
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
