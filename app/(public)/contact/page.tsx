// ================================================================
// PAGE NAME  : Contact Page
// ROUTE      : /contact
// DESCRIPTION: Contact form that saves messages to the database,
//              plus office location and contact details — Kiro-Maal
// ================================================================
"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactInfo = [
  { icon: MapPin, label: "Headquarters", value: "Hodan District, Maka Al-Mukarama Ave, Mogadishu, Somalia" },
  { icon: Phone, label: "Direct Advisory", value: "+252 61 200 0000" },
  { icon: Mail, label: "Concierge Email", value: "concierge@kiromaal.com" },
  { icon: Clock, label: "Private Hours", value: "Sat – Thu: 8:30 AM – 6:00 PM EAT" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 bg-[#F7F3EA] min-h-screen">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Kiro-Maal Concierge
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F]">Connect With Our Advisory Team</h1>
          <p className="text-[#6B7280] mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Have questions regarding premium estates, investment portfolios, or private showings? Our advisors are at your service.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Info cards */}
          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#FCFBF7] rounded-2xl p-5 border border-[#E8E1D4] shadow-sm flex items-start gap-4 transition-all hover:border-[#C89B3C]/40">
                <div className="w-11 h-11 bg-[#07111F] rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Icon className="h-5 w-5 text-[#D9B45B]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#A97918] font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-[#07111F] mt-0.5 leading-snug">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-[#07111F] border border-[#C89B3C] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-[#D9B45B]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#07111F] mb-2">Message Received</h3>
                <p className="text-[#6B7280] text-sm">Thank you for contacting Kiro-Maal Real Estate. A dedicated luxury property advisor will respond to your inquiry promptly.</p>
                <Button
                  className="mt-6 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
                  onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Full Name *</label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Ahmed Hassan"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] bg-white text-[#07111F] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] bg-white text-[#07111F] text-sm outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Phone Number</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+252 61 234 5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] bg-white text-[#07111F] text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Subject *</label>
                    <select
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] bg-white text-[#07111F] text-sm outline-none transition-colors"
                    >
                      <option value="">Select an inquiry topic...</option>
                      <option>Property Acquisition &amp; Buying</option>
                      <option>Listing A Luxury Estate</option>
                      <option>Leasing &amp; Private Rental</option>
                      <option>Investment &amp; Development Advisory</option>
                      <option>Other Services</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Message / Requirements *</label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your desired property, preferred location, or specific requirements..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] bg-white text-[#07111F] text-sm resize-none outline-none transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm transition-all"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Dispatching Message...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send Inquiry to Advisory</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
