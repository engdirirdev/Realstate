import Link from "next/link";
import {
  Building2,
  Key,
  TrendingUp,
  ShieldCheck,
  Compass,
  FileCheck2,
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
  Headphones,
  Award,
  Globe2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services & Advisory — Kiro-Maal Real Estate",
  description:
    "Explore premier real estate services in Somalia: property sales, executive leasing, AI price prediction, diaspora asset management, and verified title clearance.",
};

const services = [
  {
    icon: Building2,
    badge: "Acquisitions",
    title: "Property Sales & Acquisition",
    description:
      "Exclusive residential and commercial property sales with verified ownership. We handle private negotiations, deed transfer, escrow settlement, and notarized contracts with zero title disputes.",
    features: [
      "Verified municipal title & registry checks",
      "Prime villas, commercial land & luxury apartments",
      "Confidential buyer & seller representation",
      "Sharia-compliant transaction facilitation",
    ],
    ctaText: "Explore Properties For Sale",
    ctaHref: "/properties?listingType=FOR_SALE",
    accent: "from-[#C89B3C] to-[#D9B45B]",
  },
  {
    icon: Key,
    badge: "Leasing",
    title: "Executive Leasing & Rentals",
    description:
      "Curated residential and commercial rentals across Mogadishu, Hargeisa, Garowe, and Kismayo. Seamless digital rental agreements with automated receipts, deposit security, and manager oversight.",
    features: [
      "Short-term and long-term lease terms",
      "Pre-inspected furnished & unfurnished units",
      "Transparent security deposit protection",
      "Immediate digital receipts and lease documentation",
    ],
    ctaText: "Browse Rental Listings",
    ctaHref: "/properties?listingType=FOR_RENT",
    accent: "from-[#07111F] to-[#0B1728]",
  },
  {
    icon: TrendingUp,
    badge: "PropTech ML",
    title: "AI Valuation & Price Prediction",
    description:
      "Harness trained machine learning valuation algorithms to analyze fair market values, rental yields, and future appreciation across Somali urban corridors before investing.",
    features: [
      "Dynamic neighborhood comparative market analysis",
      "Square-meter valuation benchmarking",
      "Historical price appreciation trends",
      "Independent investment yield scoring",
    ],
    ctaText: "Try Price Prediction",
    ctaHref: "/price-prediction",
    accent: "from-[#C89B3C] to-[#E8B849]",
  },
  {
    icon: ShieldCheck,
    badge: "Asset Management",
    title: "Diaspora Property Asset Management",
    description:
      "Complete hands-off portfolio management tailored for overseas and diaspora property owners. From vetted tenant placement to scheduled repairs and digital revenue remittances.",
    features: [
      "Rigorous background checks & tenant vetting",
      "Automated rent collection & transparent ledger",
      "Routine physical property inspections & reports",
      "Preventative maintenance & 24/7 emergency response",
    ],
    ctaText: "Inquire About Management",
    ctaHref: "/contact",
    accent: "from-[#07111F] to-[#1E293B]",
  },
  {
    icon: Compass,
    badge: "Virtual Inspection",
    title: "Private VIP Tours & 360° Inspections",
    description:
      "Experience high-definition remote virtual tours, drone cinematography, and private accompanied viewings arranged around your schedule by certified concierge advisors.",
    features: [
      "Interactive 360° immersive virtual walkthroughs",
      "Architectural floor plans and dimension verification",
      "Live video stream tours with licensed agents",
      "Private VIP transportation to property sites",
    ],
    ctaText: "Schedule a Private Visit",
    ctaHref: "/contact",
    accent: "from-[#C89B3C] to-[#D9B45B]",
  },
  {
    icon: FileCheck2,
    badge: "Legal & Title",
    title: "Land Title & Legal Verification",
    description:
      "Comprehensive due diligence auditing municipal land offices, historical transfer records, and zoning status to guarantee conflict-free ownership before exchange.",
    features: [
      "Historical ownership lineage verification",
      "District municipal zoning compliance check",
      "Certified legal notary execution",
      "Dispute-free guarantee backed by documented audit",
    ],
    ctaText: "Consult Our Legal Team",
    ctaHref: "/contact",
    accent: "from-[#07111F] to-[#0B1728]",
  },
];

const pillars = [
  {
    icon: Award,
    title: "100% Verified Titles",
    desc: "Every listing is cross-checked against municipal records and physical inspection.",
  },
  {
    icon: Globe2,
    title: "Diaspora Friendly",
    desc: "Seamless remote purchasing, virtual walk-throughs, and transparent international settlements.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Intelligence",
    desc: "Fair-price benchmarks and algorithmic market insights eliminate guesswork.",
  },
  {
    icon: Headphones,
    title: "Dedicated VIP Concierge",
    desc: "Personal advisors available 24/7 to guide viewings, legalities, and transactions.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-[#FCFBF7] min-h-screen pt-24 pb-20">
      {/* ─── Hero Section ─── */}
      <section className="section-container pb-12 pt-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
            Enterprise Real Estate Services
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#07111F] tracking-tight leading-tight">
            Comprehensive Real Estate Solutions in Somalia
          </h1>

          <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed">
            From verified property sales and executive rentals to AI market valuations and diaspora asset governance, Kiro-Maal delivers institutional-grade real estate advisory with unwavering trust.
          </p>
        </div>
      </section>

      {/* ─── 6 Main Services Grid ─── */}
      <section className="section-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="bg-white rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/30 group-hover:scale-105 transition-transform shadow-xs">
                      <Icon className="w-6 h-6 text-[#C89B3C]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4]">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg sm:text-xl text-[#07111F] mb-2.5">
                    {service.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed mb-5">
                    {service.description}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-4 mb-6">
                    {service.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-[#334155]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={service.ctaHref}
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#F7F3EA] hover:bg-[#07111F] text-[#07111F] hover:text-[#D9B45B] text-xs font-bold border border-[#E8E1D4] hover:border-[#07111F] transition-all group/btn"
                >
                  <span>{service.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#C89B3C] group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Trust Pillars ─── */}
      <section className="section-container py-12">
        <div className="bg-[#07111F] rounded-3xl border border-[#C89B3C]/30 p-8 sm:p-12 text-white shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#D9B45B] uppercase tracking-widest font-mono">
              ✦ The Kiro-Maal Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7] mt-2">
              Why Institutional Clients &amp; Diaspora Trust Us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-[#0B1728]/80 border border-[#C89B3C]/20 rounded-2xl p-5 hover:border-[#C89B3C]/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B] flex items-center justify-center mb-3.5">
                    <Icon className="w-5 h-5 text-[#C89B3C]" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#FCFBF7] mb-1.5">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Bottom Call to Action ─── */}
      <section className="section-container pt-8">
        <div className="bg-gradient-to-r from-[#0B1728] via-[#07111F] to-[#0B1728] rounded-3xl p-8 sm:p-12 border border-[#C89B3C]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md text-white">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7]">
              Need a Custom Property Advisory Consultation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Speak with a licensed advisor today to discuss property acquisitions, sales mandates, or asset management across Somalia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/properties"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] font-bold text-xs sm:text-sm text-center shadow-md shadow-[#C89B3C]/20 hover:brightness-105 transition-all"
            >
              Browse Properties
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#C89B3C]" /> Contact Concierge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
