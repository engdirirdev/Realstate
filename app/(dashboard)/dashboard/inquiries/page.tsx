// ================================================================
// PAGE NAME  : Manager Dashboard — Customer Inquiries
// ROUTE      : /dashboard/inquiries
// DESCRIPTION: Manager inbox for customer property inquiries & replies
// ROLE       : USER / Manager
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Mail, Phone, Building2, MapPin, Send, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

export default function ManagerInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchInquiries = async () => {
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
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleOpenReply = (inq: any) => {
    setSelectedInquiry(inq);
    setReplyText(inq.response || "");
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          response: replyText,
          status: "RESPONDED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Reply Sent! 📩", description: "Customer has been notified of your response." });
        setReplyModalOpen(false);
        fetchInquiries();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <MessageSquare className="h-6 w-6 text-[#10B981]" /> Customer Inquiries
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Manage questions and inquiries sent by customers for your listings.</p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <p className="text-sm font-semibold text-[#0F172A]">Loading customer inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <MessageSquare className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No customer inquiries yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
            When customers view your properties and send inquiries, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-base">{inq.subject || "Property Inquiry"}</h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                    From: <span className="font-semibold text-[#0F172A]">{inq.customer?.name}</span> ({inq.customer?.email})
                    {inq.customer?.phone && <span>• Phone: {inq.customer.phone}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    inq.status === "RESPONDED"
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                      : "bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]"
                  }`}>
                    {inq.status === "RESPONDED" ? "Replied" : "New Inquiry"}
                  </span>
                  <Button
                    onClick={() => handleOpenReply(inq)}
                    size="sm"
                    className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs gap-1.5 font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" /> Reply
                  </Button>
                </div>
              </div>

              {/* Inquiry & Response Details */}
              <div className="space-y-2.5">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs font-semibold text-[#0F172A] mb-1">Customer Question:</p>
                  <p className="text-sm text-[#334155] leading-relaxed">{inq.message}</p>
                </div>

                {inq.response && (
                  <div className="bg-[#ECFDF5] p-4 rounded-xl border border-[#A7F3D0]">
                    <p className="text-xs font-bold text-[#065F46] mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> Your Response:
                    </p>
                    <p className="text-sm text-[#047857] leading-relaxed">{inq.response}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#10B981]" /> Reply to Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Send a response to {selectedInquiry?.customer?.name || "Customer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-xs">
              <p className="font-semibold text-[#0F172A]">Question:</p>
              <p className="text-[#64748B] mt-0.5 line-clamp-2">{selectedInquiry?.message}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#0F172A]">Your Reply</p>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[120px] border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setReplyModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={submittingReply || !replyText.trim()}
              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold"
            >
              {submittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
