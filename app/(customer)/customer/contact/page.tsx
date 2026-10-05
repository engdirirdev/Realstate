"use client";

// ================================================================
// PAGE NAME  : Customer VIP Concierge & Support
// ROUTE      : /customer/contact
// DESCRIPTION: In-portal private client concierge and direct advisory
//              Kiro-Maal Real Estate Master Design System
// ================================================================

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Headphones,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const contactCards = [
  {
    icon: Phone,
    label: "Direct Advisory Desk",
    value: "+252 61 200 0000",
    action: "tel:+252612000000",
    actionLabel: "Call Now",
  },
  {
    icon: MessageSquare,
    label: "WhatsApp VIP Line",
    value: "+252 61 200 0000",
    action: "https://wa.me/252612000000",
    actionLabel: "Open WhatsApp",
    isExternal: true,
  },
  {
    icon: Mail,
    label: "Private Concierge Email",
    value: "concierge@kiromaal.com",
    action: "mailto:concierge@kiromaal.com",
    actionLabel: "Send Email",
  },
  {
    icon: MapPin,
    label: "Private Advisory Office",
    value: "Maka Al-Mukarama Ave, Hodan, Mogadishu",
    sub: "Private Client Lounge (Level 4)",
  },
];

export default function CustomerContactPage() {
  const { data: session } = useSession();

  const [form, setForm] = useState({
    subject: "",
    category: "Property Consultation",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name || "Kiro-Maal Client",
          email: session?.user?.email || "customer@realestate.so",
          phone: (session?.user as any)?.phone || "+252 61 200 0000",
          subject: `[${form.category}] ${form.subject}`,
          message: form.message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSent(true);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-[#F7F3EA] min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-8 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EA] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Kiro-Maal VIP Concierge
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-3">
            <Headphones className="h-7 w-7 text-[#C89B3C]" /> VIP Concierge &amp; Support
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-1 max-w-2xl">
            Our luxury property advisors and concierge desk are available 24/7 to assist with your portfolio, private viewings, and real estate acquisitions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/customer/inquiries"
            className="px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA] hover:bg-[#EAE4D5] text-[#07111F] text-xs font-bold transition-all flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4 text-[#C89B3C]" />
            <span>My Inquiries</span>
          </Link>
          <Link
            href="/customer/properties"
            className="px-4 py-2.5 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-[#D9B45B] text-xs font-bold transition-all flex items-center gap-2"
          >
            <Building2 className="h-4 w-4 text-[#D9B45B]" />
            <span>Browse Assets</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Info Cards (Left) + Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-[#07111F] rounded-3xl p-6 text-white border border-[#C89B3C]/30 shadow-md">
            <div className="flex items-center gap-2 text-[#D9B45B] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-4 w-4" /> Dedicated Private Advisory
            </div>
            <h3 className="font-serif font-bold text-lg text-white">Your Assigned Concierge</h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              Every Kiro-Maal account is paired with a certified advisor ensuring confidential, high-caliber advisory services.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9B45B] text-[#07111F] font-bold font-serif flex items-center justify-center text-sm shadow-sm">
                KM
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kiro-Maal Executive Desk</p>
                <p className="text-[11px] text-[#D9B45B] flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> Average response: &lt; 15 mins
                </p>
              </div>
            </div>
          </div>

          {contactCards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#FCFBF7] rounded-2xl p-5 border border-[#E8E1D4] shadow-xs flex items-start gap-4 hover:border-[#C89B3C]/40 transition-all"
              >
                <div className="w-11 h-11 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl flex items-center justify-center flex-shrink-0 text-[#C89B3C]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#A97918] font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs sm:text-sm font-semibold text-[#07111F] mt-0.5 break-words">{item.value}</p>
                  {item.sub && <p className="text-[11px] text-[#6B7280] mt-0.5">{item.sub}</p>}
                  {item.action && (
                    <a
                      href={item.action}
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A97918] hover:text-[#C89B3C] mt-2 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      {item.isExternal && <ExternalLink className="h-3 w-3" />}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message / Request Form */}
        <div className="lg:col-span-2 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-8 shadow-xs">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#07111F] border border-[#C89B3C] flex items-center justify-center mx-auto text-[#D9B45B] shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#07111F]">
                Request Dispatched to VIP Concierge
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-[#07111F]">{session?.user?.name || "Client"}</strong>. Your message has been logged directly into our executive advisory desk. A dedicated luxury advisor will reach out to you shortly.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setSent(false);
                    setForm({ subject: "", category: "Property Consultation", message: "" });
                  }}
                  className="bg-[#F7F3EA] text-[#07111F] border border-[#E8E1D4] hover:bg-[#EAE4D5] rounded-xl text-xs font-bold px-5 py-2.5 shadow-none"
                >
                  Send Another Message
                </Button>
                <Link
                  href="/customer/inquiries"
                  className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  View My Inquiries →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-b border-[#E8E1D4] pb-4 mb-6">
                <h2 className="font-serif font-bold text-xl text-[#07111F]">
                  Send a Direct Advisory Inquiry
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Fill in your requirements below. Your inquiry is directly routed to your advisor.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#07111F] mb-1.5">
                      Client Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={session?.user?.name || "Logged In Client"}
                      className="w-full bg-[#F7F3EA] border border-[#E8E1D4] text-[#07111F] text-xs sm:text-sm rounded-xl px-4 py-2.5 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#07111F] mb-1.5">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={session?.user?.email || "customer@realestate.so"}
                      className="w-full bg-[#F7F3EA] border border-[#E8E1D4] text-[#07111F] text-xs sm:text-sm rounded-xl px-4 py-2.5 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#07111F] mb-1.5">
                      Inquiry Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] text-xs sm:text-sm rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:border-[#C89B3C]"
                    >
                      <option value="Property Consultation">Property Consultation</option>
                      <option value="Private Viewing Request">Private Viewing Request</option>
                      <option value="Price Valuation / AI Analysis">Price Valuation / AI Analysis</option>
                      <option value="Acquisition & Legal Advisory">Acquisition &amp; Legal Advisory</option>
                      <option value="Portfolio Management">Portfolio Management</option>
                      <option value="Other VIP Support">Other VIP Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#07111F] mb-1.5">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inquiring about luxury villa in Mogadishu"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] text-xs sm:text-sm rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:border-[#C89B3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#07111F] mb-1.5">
                    Your Message / Requirements *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Provide details about your preferred location, budget, timeline, or specific questions for our advisory team..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] text-xs sm:text-sm rounded-xl p-4 font-medium focus:outline-none focus:border-[#C89B3C] resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#C89B3C]" />
                    Confidential &amp; encrypted advisory communication
                  </p>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold text-xs sm:text-sm px-7 py-3 rounded-xl transition-all shadow-md shadow-[#C89B3C]/20 border-0 flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span>Sending Request...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Dispatch to Concierge →</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
