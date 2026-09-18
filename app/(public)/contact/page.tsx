// ================================================================
// PAGE NAME  : Contact Page
// ROUTE      : /contact
// DESCRIPTION: Contact form that saves messages to the database,
//              plus office location and contact details
// ================================================================
"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Hodan District, Mogadishu, Somalia" },
  { icon: Phone, label: "Phone", value: "+252 61 200 0000" },
  { icon: Mail, label: "Email", value: "hello@airealestate.so" },
  { icon: Clock, label: "Working Hours", value: "Sun–Thu: 8AM – 6PM EAT" },
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
    <div className="py-16 bg-[#F8FAFC] min-h-screen">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#10B981] font-bold text-sm mb-2">✦ Get in Touch</p>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">Contact Us</h1>
          <p className="text-[#64748B] mt-2 max-w-xl mx-auto">
            Have questions about a property or our platform? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Info cards */}
          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-card flex items-start gap-4">
                <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">{label}</p>
                  <p className="text-sm font-bold text-[#0F172A] mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-8">
            {sent ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-16 w-16 text-[#10B981] mx-auto mb-4" />
                <h3 className="font-display text-2xl font-bold text-[#0F172A] mb-2">Message Sent!</h3>
                <p className="text-[#64748B]">Thank you for reaching out. We'll respond within 24 hours.</p>
                <Button className="mt-6 bg-[#10B981] text-white hover:bg-[#059669] rounded-xl" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Full Name *</label>
                    <input name="name" required value={form.name} onChange={handleChange} placeholder="Ahmed Hassan" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email *</label>
                    <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Phone</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+252 61 234 5678" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Subject *</label>
                    <select name="subject" required value={form.subject} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm">
                      <option value="">Select a topic...</option>
                      <option>Property Inquiry</option>
                      <option>List My Property</option>
                      <option>Technical Support</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Message *</label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm resize-none"
                  />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="w-full gap-2 bg-[#10B981] text-white hover:bg-[#059669] rounded-xl">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send Message</>
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
