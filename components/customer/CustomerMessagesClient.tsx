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

  // New Message to Manager Modal State
  const [newOpen, setNewOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || "");
  const [selectedManagerId, setSelectedManagerId] = useState(
    properties[0]?.managerId || managers[0]?.id || ""
  );
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingNew, setSendingNew] = useState(false);

  // Follow-up Reply Modal State
  const [replyOpen, setReplyOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<any>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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

  const openFollowUpModal = (inq: any) => {
    setActiveInquiry(inq);
    setFollowUpText("");
    setReplyOpen(true);
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInquiry || !followUpText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: activeInquiry.id,
          customerReply: followUpText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.inquiry) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === activeInquiry.id ? data.inquiry : item))
        );
        setReplyOpen(false);
        setFollowUpText("");
        toast({
          title: "Reply Sent! 📩",
          description: "Your follow-up reply has been sent to the property manager.",
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
        description: "Failed to send follow-up reply.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Communication Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> Messages &amp; Manager Consultations
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Message property managers directly and view their replies in real time.
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
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-[#FCFBF7] rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#07111F] overflow-hidden flex-shrink-0 border border-[#E8E1D4]">
                    {inq.property?.images?.[0]?.url ? (
                      <img
                        src={inq.property.images[0].url}
                        alt={inq.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#A97918] uppercase tracking-wider">
                      {inq.subject || "Property Inquiry"}
                    </p>
                    {inq.property && (
                      <Link
                        href={`/customer/properties/${inq.property.id}`}
                        className="font-serif font-bold text-[#07111F] text-base hover:text-[#C89B3C] transition-colors"
                      >
                        {inq.property.title}
                      </Link>
                    )}
                    <p className="text-xs text-[#6B7280] flex flex-wrap items-center gap-2 mt-0.5">
                      {inq.property && (
                        <>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {inq.property.city}
                          </span>
                          <span>•</span>
                          <span className="font-serif font-bold text-[#07111F]">
                            {formatPrice(inq.property.price)}
                          </span>
                        </>
                      )}
                      {inq.manager && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[#07111F] font-semibold">
                            <UserCheck className="h-3.5 w-3.5 text-[#C89B3C]" /> Manager:{" "}
                            {inq.manager.name}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      inq.status === "RESPONDED"
                        ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {inq.status === "RESPONDED" ? "Manager Replied" : "Sent to Manager"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openFollowUpModal(inq)}
                    className="rounded-xl border-[#C89B3C]/40 bg-[#FAF7F2] text-[#07111F] hover:bg-[#F7F3EA] text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 text-[#C89B3C]" /> Reply
                  </Button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3">
                <div className="bg-[#F7F3EA] p-4 rounded-xl border border-[#E8E1D4]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
                    Your Message (
                    {new Date(inq.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    ):
                  </p>
                  <p className="text-xs sm:text-sm text-[#07111F] leading-relaxed whitespace-pre-line">
                    {inq.message}
                  </p>
                </div>

                {inq.response ? (
                  <div className="bg-[#07111F] p-4 rounded-xl border border-[#C89B3C]/30 text-white">
                    <p className="text-xs font-bold text-[#D9B45B] mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-[#D9B45B]" /> Manager Reply (
                      {inq.manager?.name || "Property Manager"}):
                    </p>
                    <p className="text-xs sm:text-sm text-[#E8E1D4] leading-relaxed whitespace-pre-line">
                      {inq.response}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-[#A97918] italic font-medium p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8E1D4]/60">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#C89B3C]" />
                      Waiting for manager response...
                    </span>
                    {inq.manager && (
                      <span className="not-italic text-[11px] font-bold text-[#07111F]">
                        Assigned Manager: {inq.manager.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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
              Select a property and manager to send your inquiry or message directly to their inbox.
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

      {/* Follow-Up Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#C89B3C]" /> Reply to Manager
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Send a follow-up message to {activeInquiry?.manager?.name || "the Property Manager"}{" "}
              regarding &ldquo;{activeInquiry?.property?.title || "this property"}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendFollowUp} className="space-y-4 mt-2">
            {activeInquiry?.response && (
              <div className="bg-[#07111F] p-3.5 rounded-xl border border-[#C89B3C]/30 text-xs text-white space-y-1">
                <p className="font-bold text-[#D9B45B]">Manager&apos;s Last Reply:</p>
                <p className="text-[#E8E1D4] whitespace-pre-line">{activeInquiry.response}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Your Follow-Up Message</Label>
              <Textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Write your reply to the manager..."
                className="min-h-[110px] border-[#E8E1D4] rounded-xl text-xs bg-white"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplyOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingReply || !followUpText.trim()}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0 cursor-pointer"
              >
                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

