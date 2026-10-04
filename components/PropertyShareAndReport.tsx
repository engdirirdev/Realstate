"use client";

import { useState } from "react";
import { Flag, Share2, Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface PropertyShareAndReportProps {
  propertyId: string;
  propertyTitle: string;
}

export default function PropertyShareAndReport({ propertyId, propertyTitle }: PropertyShareAndReportProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("MISLEADING");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: "Link Copied! 📋", description: "Property link copied to clipboard." });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/properties/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, reason, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Report Submitted", description: "Thank you. Our moderation team will review this listing." });
        setReportOpen(false);
        setDescription("");
      } else {
        toast({ title: "Notice", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="rounded-xl text-xs font-semibold gap-1.5 border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Share2 className="h-3.5 w-3.5 text-[#3B82F6]" />}
          {copied ? "Copied!" : "Share Listing"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="rounded-xl text-xs font-semibold gap-1.5 border-[#E2E8F0] bg-white text-[#EF4444] hover:bg-[#FEE2E2]/30"
        >
          <Flag className="h-3.5 w-3.5 text-[#EF4444]" />
          Report
        </Button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#EF4444]" /> Report Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Tell us why you are reporting &ldquo;{propertyTitle}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Reason for Report</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 border border-[#E2E8F0] rounded-xl px-3 text-xs bg-white text-[#0F172A]"
              >
                <option value="MISLEADING">Misleading information / Inaccurate photos</option>
                <option value="PRICE_FRAUD">Suspicious price or scam</option>
                <option value="DUPLICATE">Duplicate listing</option>
                <option value="UNAVAILABLE">Property is already sold or rented</option>
                <option value="OTHER">Other violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Additional Details (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context to assist the moderation team..."
                className="min-h-[90px] border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-semibold">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
