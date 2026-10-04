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
          className="rounded-xl text-xs font-semibold gap-1.5 border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#C89B3C]" /> : <Share2 className="h-3.5 w-3.5 text-[#C89B3C]" />}
          {copied ? "Copied!" : "Share Listing"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="rounded-xl text-xs font-semibold gap-1.5 border-[#E8E1D4] bg-[#FCFBF7] text-[#991B1B] hover:bg-[#991B1B]/10"
        >
          <Flag className="h-3.5 w-3.5 text-[#991B1B]" />
          Report
        </Button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#991B1B]" /> Report Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Tell us why you are reporting &ldquo;{propertyTitle}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Reason for Report</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 border border-[#E8E1D4] rounded-xl px-3 text-xs bg-white text-[#07111F] focus:outline-none focus:border-[#C89B3C]"
              >
                <option value="MISLEADING">Misleading information / Inaccurate photos</option>
                <option value="PRICE_FRAUD">Suspicious price or scam</option>
                <option value="DUPLICATE">Duplicate listing</option>
                <option value="UNAVAILABLE">Property is already sold or rented</option>
                <option value="OTHER">Other violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Additional Details (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context to assist the moderation team..."
                className="min-h-[90px] border-[#E8E1D4] bg-white rounded-xl text-xs text-[#07111F]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)} className="rounded-xl text-xs border-[#E8E1D4] text-[#07111F]">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-semibold border-0">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
