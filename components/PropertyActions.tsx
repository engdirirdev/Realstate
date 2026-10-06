"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Heart, CreditCard, Send, Loader2, Home, KeyRound, Lock, Hourglass, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { computeRental, PERIOD_LABEL } from "@/lib/rental-pricing";

interface PropertyActionsProps {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  listingType?: string | null;
  status?: string;
  availabilityStatus?: string | null;
  rentPeriod?: string | null;
  securityDeposit?: number | null;
  isNegotiable?: boolean;
  managerId?: string | null;
}

const GOLD_BTN =
  "w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl font-bold gap-2 shadow-md shadow-[#C89B3C]/15 border-0";

export default function PropertyActions({
  propertyId,
  propertyTitle,
  propertyPrice,
  listingType,
  status = "APPROVED",
  availabilityStatus,
  rentPeriod,
  securityDeposit,
  isNegotiable,
  managerId,
}: PropertyActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role as string | undefined;
  const isRent = listingType === "FOR_RENT";
  const effectiveAvailability = availabilityStatus || "AVAILABLE";
  const available =
    (status === "APPROVED" || status === "PUBLISHED") &&
    effectiveAvailability === "AVAILABLE";

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [inquirySubject, setInquirySubject] = useState(`Inquiry about ${propertyTitle}`);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const period = PERIOD_LABEL[(rentPeriod || "MONTHLY").toUpperCase()] || PERIOD_LABEL.MONTHLY;

  const rentalPreview = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    return computeRental(propertyPrice, rentPeriod, securityDeposit, s, e);
  }, [startDate, endDate, propertyPrice, rentPeriod, securityDeposit]);

  const requireCustomer = (): boolean => {
    if (!session) {
      toast({ title: "Login Required", description: "Please sign in to continue.", variant: "destructive" });
      router.push("/login");
      return false;
    }
    if (role !== "CUSTOMER") {
      toast({
        title: "Customer account required",
        description: "Only customer accounts can buy or rent properties.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const openBuy = () => requireCustomer() && setBuyOpen(true);
  const openRent = () => requireCustomer() && setRentOpen(true);

  const submitRequest = async (kind: "purchase" | "rental") => {
    setSubmitting(true);
    try {
      const res = await fetch(kind === "purchase" ? "/api/purchase-requests" : "/api/rental-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "purchase" ? { propertyId, notes } : { propertyId, startDate, endDate, notes }
        ),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: kind === "purchase" ? "Purchase Request Submitted" : "Rental Request Submitted",
          description: `Request ${data.request.requestNo} is awaiting review by the property manager.`,
        });
        setBuyOpen(false);
        setRentOpen(false);
        router.push("/customer/transactions");
      } else {
        toast({ title: "Request failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not submit your request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast({ title: "Login Required", description: "Please sign in to send property inquiries.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setSubmittingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, subject: inquirySubject, message: inquiryMsg }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Inquiry Sent! 📩", description: "The property manager has received your inquiry." });
        setInquiryModalOpen(false);
        setInquiryMsg("");
        router.push("/customer/inquiries");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send inquiry.", variant: "destructive" });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!session) {
      toast({ title: "Login Required", description: "Please sign in to save favorite properties.", variant: "destructive" });
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = await res.json();
      if (data.success) toast({ title: data.isFavorite ? "Saved to Favorites! ❤️" : "Removed from Favorites" });
    } catch {
      toast({ title: "Error", description: "Failed to update favorites." });
    }
  };

  // ---- Primary CTA depends on the real property state ----
  let primary: React.ReactNode;
  if (available && !isRent) {
    primary = (
      <Button onClick={openBuy} className={GOLD_BTN} size="lg" id="btn-buy-property">
        <Home className="h-4 w-4" /> Buy Property
      </Button>
    );
  } else if (available && isRent) {
    primary = (
      <Button onClick={openRent} className={GOLD_BTN} size="lg" id="btn-rent-property">
        <KeyRound className="h-4 w-4" /> Book Now
      </Button>
    );
  } else {
    const map: Record<string, { label: string; icon: any }> = {
      SOLD: { label: "Sold", icon: Lock },
      RENTED: { label: "Currently Rented", icon: Lock },
      BOOKING_PENDING: { label: "Booking Pending", icon: Hourglass },
      PAYMENT_PENDING: { label: "Payment Pending", icon: Hourglass },
      RENT_EXPIRED: { label: "Lease Expired", icon: Hourglass },
      INACTIVE: { label: "Inactive Listing", icon: Ban },
      REJECTED: { label: "Not Approved", icon: Ban },
    };
    const activeKey =
      effectiveAvailability !== "AVAILABLE"
        ? effectiveAvailability
        : status;
    const m = map[activeKey] || { label: "Not Available", icon: Ban };
    const Icon = m.icon;
    primary = (
      <Button disabled size="lg" className="w-full rounded-xl font-bold gap-2 bg-[#E8E1D4] text-[#6B7280]">
        <Icon className="h-4 w-4" /> {m.label}
      </Button>
    );
  }

  const isOwner = !!managerId && (session?.user as any)?.id === managerId;

  return (
    <>
      <div className="space-y-3">
        {!isOwner && primary}

        <Button
          onClick={() => setInquiryModalOpen(true)}
          variant="outline"
          className="w-full bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl font-semibold gap-2"
          size="lg"
        >
          <Mail className="h-4 w-4 text-[#C89B3C]" /> Contact Manager
        </Button>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleToggleFavorite}
            variant="outline"
            className="flex-1 gap-2 text-xs bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl font-medium"
          >
            <Heart className="h-4 w-4 text-[#C89B3C] fill-[#C89B3C]" /> Save Favorite
          </Button>
        </div>
      </div>

      {/* ─── Inquiry ─── */}
      <Dialog open={inquiryModalOpen} onOpenChange={setInquiryModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#C89B3C]" /> Contact Property Manager
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Inquire about &ldquo;{propertyTitle}&rdquo; directly with the listed property manager.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInquiry} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Subject</Label>
              <Input value={inquirySubject} onChange={(e) => setInquirySubject(e.target.value)} className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Message / Question</Label>
              <Textarea
                value={inquiryMsg}
                onChange={(e) => setInquiryMsg(e.target.value)}
                placeholder="Ask about availability, documents, viewing schedules, or utilities..."
                className="min-h-[100px] border-[#E8E1D4] rounded-xl text-sm bg-white"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInquiryModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingInquiry} className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0">
                {submittingInquiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Inquiry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Buy ─── */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <Home className="h-5 w-5 text-[#C89B3C]" /> Confirm Purchase Request
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Your request goes to the property manager for review. You pay only after it is approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-[#F7F3EA] border border-[#E8E1D4] p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-[#6B7280]">Property</span>
                <span className="font-semibold text-[#07111F] text-right">{propertyTitle}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#6B7280]">Buyer</span>
                <span className="font-semibold text-[#07111F]">{session?.user?.name || session?.user?.email}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E1D4] pt-2">
                <span className="text-[#6B7280]">Sale price{isNegotiable ? " (negotiable)" : ""}</span>
                <span className="font-bold text-[#C89B3C] text-base font-serif">{formatPrice(propertyPrice)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Notes for the manager (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] border-[#E8E1D4] rounded-xl text-sm bg-white" maxLength={2000} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setBuyOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
              Cancel
            </Button>
            <Button onClick={() => submitRequest("purchase")} disabled={submitting} className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Submit Purchase Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Rent ─── */}
      <Dialog open={rentOpen} onOpenChange={setRentOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" /> Rent This Property
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              {formatPrice(propertyPrice)} / {period.per}. Choose your rental dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Start date</Label>
                <Input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">End date</Label>
                <Input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white" />
              </div>
            </div>

            <div className="bg-[#F7F3EA] border border-[#E8E1D4] p-4 rounded-xl space-y-2 text-xs">
              {rentalPreview ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">
                      Rent ({rentalPreview.periods} {rentalPreview.periods === 1 ? period.unit : period.plural} × {formatPrice(propertyPrice)})
                    </span>
                    <span className="font-semibold text-[#07111F]">{formatPrice(rentalPreview.rentAmount)}</span>
                  </div>
                  {rentalPreview.securityDeposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Security deposit</span>
                      <span className="font-semibold text-[#07111F]">{formatPrice(rentalPreview.securityDeposit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#E8E1D4] pt-2">
                    <span className="font-bold text-[#07111F]">Total</span>
                    <span className="font-bold text-[#C89B3C] text-base font-serif">{formatPrice(rentalPreview.totalAmount)}</span>
                  </div>
                </>
              ) : (
                <p className="text-[#6B7280]">Select valid start and end dates to see the total.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Notes for the manager (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[70px] border-[#E8E1D4] rounded-xl text-sm bg-white" maxLength={2000} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setRentOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
              Cancel
            </Button>
            <Button
              onClick={() => submitRequest("rental")}
              disabled={submitting || !rentalPreview}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Submit Rental Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
