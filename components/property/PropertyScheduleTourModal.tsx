"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Video,
  Compass,
  Footprints,
  Loader2,
  CheckCircle2,
  Sparkles,
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
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface PropertyScheduleTourModalProps {
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyPrice: number;
}

export default function PropertyScheduleTourModal({
  propertyId,
  propertyTitle,
  propertyCity,
  propertyPrice,
}: PropertyScheduleTourModalProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Form State
  const [tourType, setTourType] = useState<"PHYSICAL" | "VIRTUAL_360" | "VIDEO_CALL">("PHYSICAL");
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [preferredTime, setPreferredTime] = useState("10:00 AM");
  const [notes, setNotes] = useState("");

  const timeSlots = [
    "09:00 AM",
    "10:30 AM",
    "12:00 PM",
    "02:00 PM",
    "04:00 PM",
    "05:30 PM",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast({
        title: "Account Required",
        description: "Please sign in to confirm and record your scheduled inspection booking.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!name || !phone || !preferredDate) {
      toast({
        title: "Missing Information",
        description: "Please provide your name, phone number, and preferred date.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const tourTypeLabel =
        tourType === "PHYSICAL"
          ? "Physical In-Person Visit"
          : tourType === "VIRTUAL_360"
          ? "Interactive 360° Virtual Walkthrough"
          : "Live Video Call Walkthrough";

      const formattedNotes = `[TOUR TYPE: ${tourTypeLabel}] [PREFERRED TIME: ${preferredTime}] [CONTACT: ${name} | Phone: ${phone} | Email: ${email || "N/A"}] ${notes ? `\nClient Notes: ${notes}` : ""}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate: new Date(`${preferredDate}T${preferredTime.includes("PM") && !preferredTime.startsWith("12") ? parseInt(preferredTime) + 12 : preferredTime.slice(0, 2)}:00:00`),
          notes: formattedNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessBookingId(data.booking.id);
        toast({
          title: "Tour Scheduled Successfully! 📅",
          description: `Your ${tourTypeLabel} request for ${preferredDate} at ${preferredTime} has been registered.`,
        });
      } else {
        toast({
          title: "Reservation Error",
          description: data.error || "Failed to schedule tour.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Could not schedule tour. Please verify connection and retry.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSuccessBookingId(null);
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold rounded-2xl py-3 shadow-md shadow-[#C89B3C]/20 border-0 flex items-center justify-center gap-2 cursor-pointer text-sm"
      >
        <Calendar className="h-4 w-4" /> Schedule Tour &amp; Inspection
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-xl bg-[#FCFBF7] rounded-3xl p-6 sm:p-8 border border-[#E8E1D4] shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8E1D4] pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1 w-fit border border-[#C89B3C]/30">
              <Sparkles className="h-3 w-3 text-[#D9B45B]" /> Verified Concierge Inspection
            </div>
            <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-[#07111F]">
              Schedule Tour &amp; Inspection
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Select your tour preference, date, and contact details for {propertyTitle} in {propertyCity}.
            </DialogDescription>
          </DialogHeader>

          {successBookingId ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-[#07111F]">
                  Inspection Confirmed!
                </h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
                  Your appointment request has been transmitted to the verified property manager. You can monitor its status under your customer portal.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="rounded-xl border-[#E8E1D4] text-xs font-bold"
                >
                  Done
                </Button>
                <Button
                  onClick={() => {
                    handleClose();
                    router.push("/customer/bookings");
                  }}
                  className="rounded-xl bg-[#07111F] text-[#D9B45B] text-xs font-bold hover:bg-[#1E293B]"
                >
                  View My Bookings
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-3">
              {/* Tour Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F] uppercase tracking-wider">
                  Tour Type Preference *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTourType("PHYSICAL")}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tourType === "PHYSICAL"
                        ? "bg-[#07111F] text-[#FCFBF7] border-[#C89B3C]/50 shadow-xs"
                        : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
                    }`}
                  >
                    <Footprints className="h-5 w-5 text-[#C89B3C] mb-1.5" />
                    <div>
                      <p className="font-bold text-xs">Physical Visit</p>
                      <p className="text-[10px] opacity-75">On-site walk</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTourType("VIRTUAL_360")}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tourType === "VIRTUAL_360"
                        ? "bg-[#07111F] text-[#FCFBF7] border-[#C89B3C]/50 shadow-xs"
                        : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
                    }`}
                  >
                    <Compass className="h-5 w-5 text-[#C89B3C] mb-1.5" />
                    <div>
                      <p className="font-bold text-xs">Virtual 360°</p>
                      <p className="text-[10px] opacity-75">Online guided</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTourType("VIDEO_CALL")}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tourType === "VIDEO_CALL"
                        ? "bg-[#07111F] text-[#FCFBF7] border-[#C89B3C]/50 shadow-xs"
                        : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
                    }`}
                  >
                    <Video className="h-5 w-5 text-[#C89B3C] mb-1.5" />
                    <div>
                      <p className="font-bold text-xs">Live Video Call</p>
                      <p className="text-[10px] opacity-75">WhatsApp / Zoom</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07111F]">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-[#C89B3C]" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cabdullahi Maxamed"
                      className="pl-9 h-10 rounded-xl bg-white border-[#E8E1D4] text-xs font-medium text-[#07111F] focus:border-[#C89B3C]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07111F]">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#C89B3C]" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+252 61 000 0000"
                      className="pl-9 h-10 rounded-xl bg-white border-[#E8E1D4] text-xs font-medium text-[#07111F] focus:border-[#C89B3C]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#C89B3C]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="pl-9 h-10 rounded-xl bg-white border-[#E8E1D4] text-xs font-medium text-[#07111F] focus:border-[#C89B3C]"
                  />
                </div>
              </div>

              {/* Preferred Date & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07111F]">Preferred Date *</Label>
                  <Input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="h-10 rounded-xl bg-white border-[#E8E1D4] text-xs font-medium text-[#07111F] focus:border-[#C89B3C]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#07111F]">Preferred Time Slot</Label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full h-10 rounded-xl bg-white border border-[#E8E1D4] text-xs font-medium text-[#07111F] px-3 focus:outline-none focus:border-[#C89B3C]"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Tour Notes / Specific Inquiries</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention specific areas you'd like to inspect (e.g. master bedroom, compound security, water supply)..."
                  className="rounded-xl bg-white border-[#E8E1D4] text-xs text-[#07111F] focus:border-[#C89B3C] min-h-[75px]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold rounded-2xl py-3 shadow-md border-0 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Scheduling Appointment...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" /> Confirm Scheduled Inspection
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
