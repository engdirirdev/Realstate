"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface AdminPropertyReviewModalProps {
  propertyId: string;
  propertyTitle: string;
  currentStatus: string;
}

export default function AdminPropertyReviewModal({
  propertyId,
  propertyTitle,
  currentStatus,
}: AdminPropertyReviewModalProps) {
  const router = useRouter();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED", reason?: string) => {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: status === "APPROVED" ? "Property Approved! 🎉" : "Property Rejected ⚠️",
          description: status === "APPROVED"
            ? `"${propertyTitle}" is now published and live.`
            : `Rejection reason sent to manager.`,
        });
        setRejectModalOpen(false);
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update property status.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleUpdateStatus("APPROVED")}
          disabled={loading !== null || currentStatus === "APPROVED"}
          size="sm"
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs gap-1 font-bold shadow-sm border-0"
        >
          {loading === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Approve
        </Button>

        <Button
          onClick={() => setRejectModalOpen(true)}
          disabled={loading !== null || currentStatus === "REJECTED"}
          variant="outline"
          size="sm"
          className="border-[#E8E1D4] text-[#DC2626] bg-[#FCFBF7] hover:bg-red-50 hover:border-red-200 rounded-xl text-xs gap-1 font-medium transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>

      {/* Rejection Reason Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-[#07111F] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#C89B3C]" /> Reject Property Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Provide a clear rejection reason for &ldquo;{propertyTitle}&rdquo;. The property manager will review this feedback to remediate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Rejection Reason / Feedback</p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete description, low quality primary photo, or unverified address..."
                className="min-h-[100px] border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateStatus("REJECTED", rejectionReason)}
              disabled={loading === "REJECTED" || !rejectionReason.trim()}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl gap-2 font-semibold border-0"
            >
              {loading === "REJECTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
