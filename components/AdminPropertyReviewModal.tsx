"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface AdminPropertyReviewModalProps {
  propertyId: string;
  propertyTitle: string;
  currentStatus: string;
  availabilityStatus?: string | null;
}

export default function AdminPropertyReviewModal({
  propertyId,
  propertyTitle,
  currentStatus,
  availabilityStatus,
}: AdminPropertyReviewModalProps) {
  const router = useRouter();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const isSold = currentStatus === "SOLD" || availabilityStatus === "SOLD";
  const isRented = currentStatus === "RENTED" || availabilityStatus === "RENTED";

  // If already finalized as Sold or Rented, approval is permanently locked
  if (isSold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 text-slate-100 border border-slate-700 shadow-2xs">
        <Lock className="w-3.5 h-3.5 text-[#D9B45B]" /> Sold
      </span>
    );
  }

  if (isRented) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-900 text-indigo-100 border border-indigo-700 shadow-2xs">
        <Lock className="w-3.5 h-3.5 text-indigo-300" /> Rented
      </span>
    );
  }

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED", reason?: string) => {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: status === "APPROVED" ? "Property Approved! 🎉" : "Property Rejected ⚠️",
          description: status === "APPROVED"
            ? `"${propertyTitle}" is now published and live.`
            : `Rejection reason sent to manager.`,
        });
        setRejectModalOpen(false);
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to update property status.", variant: "destructive" });
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
        {currentStatus === "APPROVED" || currentStatus === "PUBLISHED" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-2xs select-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" /> Approved
          </span>
        ) : (
          <Button
            onClick={() => handleUpdateStatus("APPROVED")}
            disabled={loading !== null || isSold || isRented}
            size="sm"
            className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs gap-1 font-bold shadow-sm border-0 cursor-pointer"
          >
            {loading === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve
          </Button>
        )}

        {currentStatus === "REJECTED" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white shadow-2xs select-none">
            <XCircle className="w-3.5 h-3.5 text-white stroke-[2.5]" /> Rejected
          </span>
        ) : (
          <Button
            onClick={() => setRejectModalOpen(true)}
            disabled={loading !== null || isSold || isRented}
            variant="outline"
            size="sm"
            className="border-[#E8E1D4] text-[#DC2626] bg-[#FCFBF7] hover:bg-red-50 hover:border-red-200 rounded-xl text-xs gap-1 font-medium transition-colors cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </Button>
        )}
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="border-[#E8E1D4] text-[#6B7280] rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading !== null || !rejectionReason.trim()}
              onClick={() => handleUpdateStatus("REJECTED", rejectionReason)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs gap-1 font-bold"
            >
              {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
