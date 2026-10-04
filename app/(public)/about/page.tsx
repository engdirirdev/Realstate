// ================================================================
// PAGE NAME  : About Page
// ROUTE      : /about
// DESCRIPTION: Company info, mission, team, technology stack
//              and platform statistics — Kiro-Maal Real Estate
// ================================================================
import Link from "next/link";
import { Building2, Users, Bot, Globe, Heart, Zap, CheckCircle2, Star, Sparkles, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us – Kiro-Maal Real Estate",
  description: "Learn about Somalia's leading luxury AI-powered real estate platform and our mission.",
};

const team = [
  { name: "Mohamed Ali Hassan", role: "CEO & Co-Founder", emoji: "👨‍💼" },
  { name: "Fadumo Warsame", role: "Chief AI Officer", emoji: "👩‍💻" },
  { name: "Abdi Noor", role: "Head of Properties", emoji: "🏠" },
  { name: "Ifrah Said", role: "Lead Designer", emoji: "🎨" },
];

const stats = [
  { value: "55+", label: "Verified Luxury Properties", icon: Building2 },
  { value: "11+", label: "Happy Clients & Investors", icon: Users },
  { value: "99%", label: "Market Data Accuracy", icon: Star },
  { value: "24/7", label: "AI Concierge & Valuation", icon: Bot },
];

const values = [
  { icon: Zap, title: "Innovation First", desc: "We leverage cutting-edge AI and ML to transform how clients find and value premium properties." },
  { icon: Heart, title: "Community Driven", desc: "Built by Somalis, for Somalis. We understand the local luxury market deeply." },
  { icon: Globe, title: "Transparent Platform", desc: "No hidden fees, no fake listings. Every property is rigorously verified before listing." },
  { icon: CheckCircle2, title: "Data Integrity", desc: "Our AI assistant speaks exclusively from real database listings — zero hallucinations." },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-[#F7F3EA] min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#07111F] py-20 text-center text-white overflow-hidden border-b border-[#C89B3C]/20">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#C89B3C_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative section-container">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1728] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Our Heritage &amp; Vision
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
              Transforming Real Estate in Somalia with <span className="text-[#D9B45B]">Kiro-Maal AI</span>
            </h1>
            <p className="text-[#E8E1D4]/80 text-lg leading-relaxed max-w-2xl mx-auto font-light">
              We&apos;re on a mission to make luxury property discovery smarter, fairer, and seamlessly accessible for every Somali — whether you&apos;re in Mogadishu or anywhere across the diaspora.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[#FCFBF7] border-b border-[#E8E1D4]">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center bg-[#FFFFFF] border border-[#E8E1D4] shadow-sm rounded-2xl p-6 transition-all hover:border-[#C89B3C]/50 hover:shadow-md">
                <div className="w-14 h-14 bg-[#07111F] border border-[#C89B3C]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Icon className="h-7 w-7 text-[#D9B45B]" />
                </div>
                <div className="font-serif text-3xl font-bold text-[#07111F]">{value}</div>
                <div className="text-xs font-medium text-[#6B7280] mt-1.5 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-[#F7F3EA]">
        <div className="section-container max-w-3xl mx-auto text-center">
          <p className="text-[#C89B3C] font-semibold text-xs tracking-wider uppercase mb-2">✦ Our Mission</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F] mb-5">Why We Built Kiro-Maal</h2>
          <p className="text-[#4B5563] text-base leading-relaxed mb-4">
            Finding luxury real estate in Somalia has traditionally been difficult — a mix of word-of-mouth, unverified listings, and fragmented brokers. We established Kiro-Maal Real Estate to set the master standard for transparency, architecture, and technology.
          </p>
          <p className="text-[#4B5563] text-base leading-relaxed">
            By combining an exquisite digital experience with machine learning price intelligence and an interactive 24/7 AI concierge, we deliver the most prestigious property platform in East Africa.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#FCFBF7] border-y border-[#E8E1D4]">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-[#C89B3C] font-semibold text-xs tracking-wider uppercase mb-2">✦ What We Stand For</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F]">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[#E8E1D4] hover:border-[#C89B3C]/50 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-[#F7F3EA] border border-[#E8E1D4] group-hover:bg-[#07111F] group-hover:border-[#C89B3C] rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="h-6 w-6 text-[#C89B3C] group-hover:text-[#D9B45B] transition-colors" />
                </div>
                <h3 className="font-serif font-bold text-[#07111F] text-lg mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-[#F7F3EA]">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-[#C89B3C] font-semibold text-xs tracking-wider uppercase mb-2">✦ The Leadership</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F]">Meet Our Executive Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {team.map(({ name, role, emoji }) => (
              <div key={name} className="text-center bg-[#FCFBF7] border border-[#E8E1D4] shadow-sm rounded-2xl p-6 transition-all hover:border-[#C89B3C]">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-4xl border border-[#E8E1D4] shadow-inner">
                  {emoji}
                </div>
                <h3 className="font-serif font-bold text-[#07111F] text-sm">{name}</h3>
                <p className="text-xs text-[#C89B3C] font-semibold mt-1 uppercase tracking-wide">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#07111F] text-center border-t border-[#C89B3C]/20 relative overflow-hidden">
        <div className="section-container relative z-10">
          <h2 className="font-serif text-3xl font-bold text-white mb-3">Ready to Find Your Dream Property?</h2>
          <p className="text-[#E8E1D4]/80 mb-8 max-w-xl mx-auto">
            Join discerning buyers, tenants, and investors who trust Kiro-Maal Real Estate for premium properties across Somalia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 px-8 py-3.5 text-sm rounded-xl transition-all shadow-md"
            >
              Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border border-[#C89B3C]/50 text-white hover:bg-white/10 px-8 py-3.5 text-sm rounded-xl transition-all font-semibold"
            >
              Contact Advisory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
