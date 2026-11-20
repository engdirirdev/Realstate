// ================================================================
// COMPONENT  : ManagerInquiriesClient
// DESCRIPTION: Manager inbox for customer property inquiries & messages
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ManagerInquiriesClientProps {
  initialInquiries?: any[];
}

function ManagerInquiriesClient({ initialInquiries = [] }: ManagerInquiriesClientProps) {
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [loading, setLoading] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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

  const handleOpenReply = useCallback((inq: any) => {
    setSelectedInquiry(inq);
    setReplyText(inq.response || "");
    setReplyModalOpen(true);
  }, []);

  const handleSendReply = useCallback(async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          response: replyText.trim(),
          status: "RESPONDED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Reply Sent! 📩",
          description: "The customer has received your reply in their Messages inbox.",
        });
        setReplyModalOpen(false);
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === selectedInquiry.id
              ? { ...item, status: "RESPONDED", response: replyText.trim() }
              : item
          )
        );
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    } finally {
      setSubmittingReply(false);
    }
  }, [selectedInquiry, replyText]);

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Direct Buyer Communications
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> Customer Messages &amp; Inquiries
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Receive and reply to messages, property questions, and consultations from customers.
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
          <p className="font-serif font-bold text-[#07111F] text-base">Loading Customer Messages...</p>
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
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif font-bold text-[#07111F] text-base">
                      {inq.subject || `Inquiry about ${inq.property?.title || "Property"}`}
                    </h3>
                    {inq.property && (
                      <Link
                        href={`/properties/${inq.property.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F7F3EA] border border-[#E8E1D4] text-[11px] font-bold text-[#A97918] hover:text-[#07111F]"
                      >
                        <Building2 className="h-3 w-3 text-[#C89B3C]" />
                        {inq.property.title} ({inq.property.city} • {formatPrice(inq.property.price)})
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] flex flex-wrap items-center gap-2">
                    <span>
                      Customer:{" "}
                      <strong className="text-[#07111F]">
                        {inq.customer?.name || inq.name || "Customer"}
                      </strong>{" "}
                      ({inq.customer?.email || inq.email})
                    </span>
                    {(inq.customer?.phone || inq.phone) && (
                      <span>• Tel: {inq.customer?.phone || inq.phone}</span>
                    )}
                    {inq.createdAt && (
                      <span className="inline-flex items-center gap-1 text-[#A97918]">
                        • <Clock className="h-3 w-3" />{" "}
                        {new Date(inq.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      inq.status === "RESPONDED"
                        ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {inq.status === "RESPONDED" ? "Replied" : "Needs Reply"}
                  </span>
                  <Button
                    onClick={() => handleOpenReply(inq)}
                    size="sm"
                    className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs gap-1.5 font-bold shadow-xs border-0 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {inq.response ? "Update Reply" : "Reply to Customer"}
                  </Button>
                </div>
              </div>

              {/* Customer Message & Manager Reply Thread */}
              <div className="space-y-3">
                <div className="bg-[#F7F3EA] p-4 rounded-xl border border-[#E8E1D4]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">
                    Customer Message:
                  </p>
                  <p className="text-sm text-[#07111F] leading-relaxed whitespace-pre-line">
                    {inq.message}
                  </p>
                </div>

                {inq.response && (
                  <div className="bg-[#07111F] p-4 rounded-xl border border-[#C89B3C]/30 text-white">
                    <p className="text-xs font-bold text-[#D9B45B] mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-[#D9B45B]" /> Your Reply to Customer:
                    </p>
                    <p className="text-sm text-[#E8E1D4] leading-relaxed whitespace-pre-line">
                      {inq.response}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#C89B3C]" /> Reply to Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Send a direct reply to{" "}
              {selectedInquiry?.customer?.name || selectedInquiry?.name || "Customer"} regarding{" "}
              &ldquo;{selectedInquiry?.property?.title || "their inquiry"}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-[#F7F3EA] p-3.5 rounded-xl border border-[#E8E1D4] text-xs space-y-1">
              <p className="font-bold text-[#07111F]">Customer Message:</p>
              <p className="text-[#4B5563] whitespace-pre-line max-h-32 overflow-y-auto">
                {selectedInquiry?.message}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Your Reply
              </p>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to the customer here..."
                className="min-h-[120px] border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setReplyModalOpen(false)}
              className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={submittingReply || !replyText.trim()}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold border-0 shadow-sm cursor-pointer"
            >
              {submittingReply ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(ManagerInquiriesClient);
