"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Send,
  Plus,
  Loader2,
  RefreshCw,
  UserCheck,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { parseInquiryThread } from "@/lib/inquiry-thread";

interface PropertyOption {
  id: string;
  title: string;
  city: string;
  price: number;
  managerId: string | null;
  managerName: string;
}

interface ManagerOption {
  id: string;
  name: string;
  email: string;
}

interface CustomerMessagesClientProps {
  initialInquiries: any[];
  properties: PropertyOption[];
  managers: ManagerOption[];
}

export default function CustomerMessagesClient({
  initialInquiries = [],
  properties = [],
  managers = [],
}: CustomerMessagesClientProps) {
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [loading, setLoading] = useState(false);

  // Per-card inline reply draft
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, string>>({});
  const [sendingInlineId, setSendingInlineId] = useState<string | null>(null);

  // New Message to Manager Modal State
  const [newOpen, setNewOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || "");
  const [selectedManagerId, setSelectedManagerId] = useState(
    properties[0]?.managerId || managers[0]?.id || ""
  );
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingNew, setSendingNew] = useState(false);

  const refreshMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      if (data.success && Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const found = properties.find((p) => p.id === propId);
    if (found?.managerId) {
      setSelectedManagerId(found.managerId);
    }
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message for the property manager.",
        variant: "destructive",
      });
      return;
    }

    setSendingNew(true);
    try {
      const targetProp = properties.find((p) => p.id === selectedPropertyId);
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId || undefined,
          managerId: selectedManagerId || undefined,
          subject:
            subject.trim() ||
            (targetProp ? `Inquiry about ${targetProp.title}` : "Property Consultation"),
          message: messageText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.inquiry) {
        setInquiries((prev) => [data.inquiry, ...prev]);
        setNewOpen(false);
        setSubject("");
        setMessageText("");
        toast({
          title: "Message Sent to Manager! 📩",
          description: "The property manager has received your message and can reply directly.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not send message",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message to manager.",
        variant: "destructive",
      });
    } finally {
      setSendingNew(false);
    }
  };

  const handleSendInlineReply = async (inquiryId: string) => {
    const text = (inlineDrafts[inquiryId] || "").trim();
    if (!text) return;

    setSendingInlineId(inquiryId);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId,
          customerReply: text,
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
          description: "Your reply has been added to the conversation.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not send reply",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
    } finally {
      setSendingInlineId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Communication Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> Messages &amp; Manager Consultations
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Live two-way conversations with property managers regarding your inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMessages}
            disabled={loading}
            className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C89B3C] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setNewOpen(true)}
            className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 shadow-sm border-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Message a Manager
          </Button>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <MessageSquare className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No conversation threads yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            Click &quot;Message a Manager&quot; above or click &quot;Contact Manager&quot; on any property page to start a conversation with a property manager.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:brightness-105 border-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Message a Manager
            </Button>
            <Link
              href="/customer/properties"
              className="inline-flex items-center gap-2 bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-[#0B1728]"
            >
              <Building2 className="h-4 w-4" /> Browse Properties
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {inquiries.map((inq) => {
            const thread = parseInquiryThread(inq);
            const lastTurn = thread[thread.length - 1];
            const isManagerLast = lastTurn?.sender === "MANAGER";

            return (
              <div
                key={inq.id}
                className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden hover:border-[#C89B3C]/50 transition-all"
              >
                {/* ─── Smart Card Top Header ─── */}
                <div className="bg-gradient-to-r from-[#07111F] via-[#0B1728] to-[#07111F] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C89B3C]/30">
                  <div className="flex items-center gap-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#C89B3C]/20 text-[#D9B45B] border border-[#C89B3C]/30">
                          {inq.subject || "Property Consultation"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {thread.length} {thread.length === 1 ? "message" : "messages"}
                        </span>
                      </div>
                      {inq.property && (
                        <Link
                          href={`/customer/properties/${inq.property.id}`}
                          className="font-serif font-bold text-white text-base hover:text-[#D9B45B] transition-colors block mt-0.5"
                        >
                          {inq.property.title}
                        </Link>
                      )}
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                        {inq.property && (
                          <>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-[#D9B45B]" /> {inq.property.city}
                            </span>
                            <span>•</span>
                            <span className="font-serif font-bold text-[#D9B45B]">
                              {formatPrice(inq.property.price)}
                            </span>
                          </>
                        )}
                        {inq.manager && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-white font-semibold">
                              <UserCheck className="h-3.5 w-3.5 text-[#D9B45B]" /> Manager:{" "}
                              {inq.manager.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isManagerLast
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                          : "bg-[#C89B3C]/20 text-[#D9B45B] border border-[#C89B3C]/40"
                      }`}
                    >
                      {isManagerLast ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Manager Replied
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5" /> Awaiting Manager Reply
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
                                <>You ({msg.senderName})</>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#D9B45B]" />{" "}
                                  {inq.manager?.name || msg.senderName} • Manager
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
                        handleSendInlineReply(inq.id);
                      }
                    }}
                    placeholder={`Write a reply to ${inq.manager?.name || "Property Manager"}...`}
                    className="flex-1 h-10 rounded-xl border-[#E8E1D4] bg-white text-xs sm:text-sm text-[#07111F] focus:border-[#C89B3C]"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSendInlineReply(inq.id)}
                    disabled={
                      sendingInlineId === inq.id || !(inlineDrafts[inq.id] || "").trim()
                    }
                    className="h-10 px-4 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0 shadow-xs cursor-pointer shrink-0"
                  >
                    {sendingInlineId === inq.id ? (
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

      {/* New Message to Manager Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#C89B3C]" /> Message a Property Manager
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Select a property and manager to start a direct conversation thread.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendNewMessage} className="space-y-4 mt-2">
            {managers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Select Property Manager</Label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold outline-none"
                >
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {properties.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Regarding Property</Label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.city} • {formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Schedule a viewing / Price inquiry"
                className="h-10 border-[#E8E1D4] rounded-xl text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Your Message</Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your message or question for the manager..."
                className="min-h-[110px] border-[#E8E1D4] rounded-xl text-xs bg-white"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingNew || !messageText.trim()}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0 cursor-pointer"
              >
                {sendingNew ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
