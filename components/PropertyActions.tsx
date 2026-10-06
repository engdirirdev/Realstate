"use client";

import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Heart,
  CreditCard,
  Send,
  Loader2,
  Home,
  KeyRound,
  Lock,
  Hourglass,
  Ban,
  ArrowRight,
  ArrowLeft,
  Building,
  Smartphone,
  CheckCircle2,
  Info,
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
import { computeRental, PERIOD_LABEL } from "@/lib/rental-pricing";
import type { PaymentMethodConfig } from "@/lib/payment-settings";

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
  const [rentalStep, setRentalStep] = useState<1 | 2>(1);

  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [inquirySubject, setInquirySubject] = useState(`Inquiry about ${propertyTitle}`);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment method selection & transaction reference
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("evc_plus");
  const [transactionRef, setTransactionRef] = useState("");
  const [loadingMethods, setLoadingMethods] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const period = PERIOD_LABEL[(rentPeriod || "MONTHLY").toUpperCase()] || PERIOD_LABEL.MONTHLY;

  // Load centralized payment methods when opening the rental flow
  useEffect(() => {
    if (rentOpen && paymentMethods.length === 0) {
      setLoadingMethods(true);
      fetch("/api/payment-methods")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.methods) && data.methods.length > 0) {
            setPaymentMethods(data.methods);
            setSelectedMethodId(data.methods[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingMethods(false));
    }
  }, [rentOpen, paymentMethods.length]);

  const rentalPreview = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    return computeRental(propertyPrice, rentPeriod, securityDeposit, s, e);
  }, [startDate, endDate, propertyPrice, rentPeriod, securityDeposit]);

  const selectedPaymentMethod = useMemo(() => {
    return paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];
  }, [paymentMethods, selectedMethodId]);

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
  const openRent = () => {
    if (requireCustomer()) {
      setRentalStep(1);
      setRentOpen(true);
    }
  };

  const submitPurchaseRequest = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Purchase Request Submitted",
          description: `Request ${data.request.requestNo} is awaiting review by the property manager.`,
        });
        setBuyOpen(false);
        router.push("/customer/requests");
      } else {
        toast({ title: "Request failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not submit your request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitRentalBooking = async () => {
    if (!rentalPreview) {
      toast({ title: "Invalid dates", description: "Please enter valid check-in and check-out dates.", variant: "destructive" });
      return;
    }
    if (!transactionRef.trim()) {
      toast({ title: "Transaction Reference Required", description: "Please enter your payment transaction reference / receipt code.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rental-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate,
          endDate,
          notes,
          paymentMethod: selectedPaymentMethod?.name || "EVC Plus",
          transactionRef: transactionRef.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Payment submitted successfully 🎉",
          description: "Your booking is waiting for Manager approval.",
        });
        setRentOpen(false);
        setRentalStep(1);
        setTransactionRef("");
        router.push("/customer/requests");
      } else {
        toast({ title: "Booking failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not submit your booking. Please try again.", variant: "destructive" });
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

      {/* ─── Inquiry Modal ─── */}
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
              <Input
                value={inquirySubject}
                onChange={(e) => setInquirySubject(e.target.value)}
                className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white"
                required
              />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setInquiryModalOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-[#07111F]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingInquiry}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0"
              >
                {submittingInquiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Inquiry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Buy Modal ─── */}
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
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] border-[#E8E1D4] rounded-xl text-sm bg-white"
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBuyOpen(false)}
              className="rounded-xl border-[#E8E1D4] text-[#07111F]"
            >
              Cancel
            </Button>
            <Button
              onClick={submitPurchaseRequest}
              disabled={submitting}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Submit Purchase Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Multi-Step Rental Booking Flow Modal ─── */}
      <Dialog
        open={rentOpen}
        onOpenChange={(o) => {
          if (!o) {
            setRentOpen(false);
            setRentalStep(1);
          }
        }}
      >
        <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
                Step {rentalStep} of 2: {rentalStep === 1 ? "Booking Details" : "Manual Payment"}
              </span>
              <span className="text-xs font-semibold text-[#C89B3C]">
                {formatPrice(propertyPrice)} / {period.per}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2 mt-1">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" />
              {rentalStep === 1 ? "Rent This Property" : "Dedicated Payment Step"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              {rentalStep === 1
                ? "Choose your tenancy dates and review the rental summary before payment."
                : "Select your preferred payment method and submit your transaction reference for verification."}
            </DialogDescription>
          </DialogHeader>

          {/* ──── STEP 1: COLLECT RENTAL DATES & SUMMARY ──── */}
          {rentalStep === 1 && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#07111F]">Check-in Date *</Label>
                  <Input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#07111F]">Check-out Date *</Label>
                  <Input
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 border-[#E8E1D4] rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-[#F7F3EA] border border-[#E8E1D4] p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between pb-1 border-b border-[#E8E1D4]">
                  <span className="text-[#6B7280]">Customer</span>
                  <span className="font-semibold text-[#07111F]">{session?.user?.name || session?.user?.email}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-[#E8E1D4]">
                  <span className="text-[#6B7280]">Property</span>
                  <span className="font-semibold text-[#07111F] text-right truncate max-w-[200px]">{propertyTitle}</span>
                </div>

                {rentalPreview ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">
                        Rental Period:
                      </span>
                      <span className="font-semibold text-[#07111F]">
                        {rentalPreview.periods} {rentalPreview.periods === 1 ? period.unit : period.plural}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Rent Amount</span>
                      <span className="font-semibold text-[#07111F]">{formatPrice(rentalPreview.rentAmount)}</span>
                    </div>
                    {rentalPreview.securityDeposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Security Deposit</span>
                        <span className="font-semibold text-[#07111F]">{formatPrice(rentalPreview.securityDeposit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[#E8E1D4] pt-2">
                      <span className="font-bold text-[#07111F] text-sm">Total Amount Due</span>
                      <span className="font-bold text-[#C89B3C] text-base font-serif">{formatPrice(rentalPreview.totalAmount)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[#6B7280] italic py-1">
                    Select valid check-in and check-out dates to calculate total rent and security deposit.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Notes for the Manager (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Preferred check-in hour, key collection preferences..."
                  className="min-h-[60px] border-[#E8E1D4] rounded-xl text-xs bg-white"
                  maxLength={2000}
                />
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRentOpen(false)}
                  className="rounded-xl border-[#E8E1D4] text-[#07111F]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!rentalPreview}
                  onClick={() => setRentalStep(2)}
                  className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl gap-2 font-bold border-0 hover:opacity-95 cursor-pointer"
                >
                  Continue to Payment <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ──── STEP 2: DEDICATED PAYMENT PAGE ──── */}
          {rentalStep === 2 && rentalPreview && (
            <div className="space-y-4 mt-2">
              {/* Payment Summary */}
              <div className="bg-[#07111F] text-white p-4 rounded-xl border border-[#C89B3C]/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-[#D9B45B] uppercase tracking-wider text-[11px]">
                    Payment Summary
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    {rentalPreview.periods} {rentalPreview.periods === 1 ? period.unit : period.plural}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#94A3B8] block">Property:</span>
                    <span className="font-semibold text-white truncate block">{propertyTitle}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block">Customer:</span>
                    <span className="font-semibold text-white truncate block">{session?.user?.name || session?.user?.email}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block">Check-in:</span>
                    <span className="font-semibold text-white">{new Date(startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block">Check-out:</span>
                    <span className="font-semibold text-white">{new Date(endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[#94A3B8] block">
                      Rent: {formatPrice(rentalPreview.rentAmount)}
                      {rentalPreview.securityDeposit > 0 && ` + Deposit: ${formatPrice(rentalPreview.securityDeposit)}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#D9B45B] block font-bold uppercase">Total Amount</span>
                    <span className="font-serif font-black text-lg text-[#D9B45B]">{formatPrice(rentalPreview.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Select Payment Method
                </Label>
                {loadingMethods ? (
                  <div className="flex items-center justify-center p-4 text-xs text-[#6B7280]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C] mr-2" /> Loading payment channels...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((m) => {
                      const isSelected = selectedMethodId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FAF6EC] border-[#C89B3C] ring-2 ring-[#C89B3C]/30 shadow-xs"
                              : "bg-white border-[#E8E1D4] hover:border-[#C89B3C]/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#07111F]">{m.name}</span>
                            {m.type === "mobile_money" ? (
                              <Smartphone className="h-3.5 w-3.5 text-[#C89B3C]" />
                            ) : (
                              <Building className="h-3.5 w-3.5 text-[#C89B3C]" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#6B7280] mt-1 font-mono">{m.accountNumber}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Method Instructions & Reference Input */}
              {selectedPaymentMethod && (
                <div className="bg-[#FAF6EC] border border-[#E8DEC8] p-3.5 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#8C6D23] font-bold">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Settlement Instructions — {selectedPaymentMethod.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-[#E8DEC8]">
                    {selectedPaymentMethod.bankName && (
                      <div className="col-span-2">
                        <span className="text-[#6B7280] block text-[10px]">Bank Name:</span>
                        <span className="font-bold text-[#07111F]">{selectedPaymentMethod.bankName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#6B7280] block text-[10px]">Account Name:</span>
                      <span className="font-bold text-[#07111F]">{selectedPaymentMethod.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block text-[10px]">
                        {selectedPaymentMethod.type === "bank_transfer" ? "Account Number:" : "Merchant / Phone #:"}
                      </span>
                      <span className="font-mono font-bold text-[#07111F]">{selectedPaymentMethod.accountNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#6B7280] block text-[10px]">Amount to Transfer:</span>
                      <span className="font-serif font-black text-sm text-[#C89B3C]">{formatPrice(rentalPreview.totalAmount)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {selectedPaymentMethod.instructions}
                  </p>

                  <div className="space-y-1 pt-1 border-t border-[#E8DEC8]">
                    <Label className="text-xs font-bold text-[#07111F]">
                      Transaction Reference / SMS Confirmation Code *
                    </Label>
                    <Input
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. TXN-819203 or mobile money SMS confirmation ID"
                      className="h-10 bg-white border-[#C89B3C]/50 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#C89B3C]"
                      required
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      Your payment will be registered as <span className="font-bold text-[#8C6D23]">PENDING VERIFICATION</span> until Manager reviews.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRentalStep(1)}
                  className="rounded-xl border-[#E8E1D4] text-[#07111F] gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Dates
                </Button>
                <Button
                  type="button"
                  onClick={submitRentalBooking}
                  disabled={submitting || !transactionRef.trim()}
                  className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl gap-2 font-bold border-0 hover:opacity-95 cursor-pointer shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Proceed &amp; Submit Booking
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
