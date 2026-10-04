"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Phone, Mail, Heart, Calendar, CreditCard, Send, Loader2, CheckCircle2, ShieldCheck, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface PropertyActionsProps {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
}

export default function PropertyActions({ propertyId, propertyTitle, propertyPrice }: PropertyActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [inquiryMsg, setInquiryMsg] = useState("");
  const [inquirySubject, setInquirySubject] = useState(`Inquiry about ${propertyTitle}`);

  const [bookingNotes, setBookingNotes] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Send Inquiry
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

  // Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast({ title: "Login Required", description: "Please sign in to reserve a property.", variant: "destructive" });
      router.push("/login");
      return;
    }
    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, notes: bookingNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedBookingId(data.booking.id);
        toast({ title: "Reservation Created! 📅", description: "Proceed to confirm with Demo Payment." });
        setBookingModalOpen(false);
        setPaymentModalOpen(true);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create booking.", variant: "destructive" });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Process Demo Payment
  const handleProcessPayment = async () => {
    setProcessingPayment(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: createdBookingId,
          propertyId,
          amount: propertyPrice,
          paymentMethod: "DEMO / SANDBOX",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Payment Successful! 💳", description: `Ref: ${data.payment.transactionRef}. Booking confirmed.` });
        setPaymentModalOpen(false);
        router.push("/customer/payments");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to process payment.", variant: "destructive" });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Toggle Favorite
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
      if (data.success) {
        toast({ title: data.isFavorite ? "Saved to Favorites! ❤️" : "Removed from Favorites" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update favorites." });
    }
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={() => setBookingModalOpen(true)}
          className="w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl font-bold gap-2 shadow-md shadow-[#C89B3C]/15 border-0"
          size="lg"
        >
          <Calendar className="h-4 w-4" /> Book / Reserve Property
        </Button>

        <Button
          onClick={() => setInquiryModalOpen(true)}
          variant="outline"
          className="w-full bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl font-semibold gap-2"
          size="lg"
        >
          <Mail className="h-4 w-4 text-[#C89B3C]" /> Send Property Enquiry
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

      {/* ─── Modal 1: Send Inquiry ─── */}
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
                placeholder="Ask about availability, deposit, viewing schedules, or utilities..."
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

      {/* ─── Modal 2: Book / Reserve Property ─── */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#C89B3C]" /> Reserve Property
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Reserve &ldquo;{propertyTitle}&rdquo; for {formatPrice(propertyPrice)}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBooking} className="space-y-4 mt-2">
            <div className="bg-[#F7F3EA] border border-[#E8E1D4] p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Property Listing:</span>
                <span className="font-semibold text-[#07111F] truncate max-w-[200px]">{propertyTitle}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#E8E1D4] pt-2">
                <span className="text-[#6B7280]">Total Amount:</span>
                <span className="font-bold text-[#C89B3C] text-base font-serif">{formatPrice(propertyPrice)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Special Requests / Inspection Date</Label>
              <Textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Specify preferred move-in date or inspection time..."
                className="min-h-[80px] border-[#E8E1D4] rounded-xl text-sm bg-white"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setBookingModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingBooking} className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold border-0">
                {submittingBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Proceed to Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Demo / Sandbox Payment ─── */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#C89B3C]" /> Demo / Sandbox Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Simulate instant payment processing for this property reservation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-[#07111F] border border-[#C89B3C]/30 p-4 rounded-xl space-y-2 text-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D9B45B]">
                <ShieldCheck className="h-4 w-4 text-[#C89B3C]" /> Sandbox Environment Active
              </div>
              <p className="text-xs text-[#94A3B8]">
                No actual credit card charge will occur. Clicking Pay Now generates an official receipt and updates your booking to Confirmed.
              </p>
              <div className="pt-2 border-t border-[#C89B3C]/20 flex justify-between text-xs font-bold text-white">
                <span>Total Due:</span>
                <span className="text-sm font-serif text-[#D9B45B]">{formatPrice(propertyPrice)} USD</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleProcessPayment}
              disabled={processingPayment}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] rounded-xl gap-2 font-bold shadow-md shadow-[#C89B3C]/15 border-0"
            >
              {processingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Pay {formatPrice(propertyPrice)} Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
