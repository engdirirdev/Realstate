import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";

const footerLinks = {
  Company: [
    { label: "About Us",  href: "/about" },
    { label: "Services",  href: "/services" },
    { label: "Contact",   href: "/contact" },
  ],
  Properties: [
    { label: "Houses",      href: "/properties?type=HOUSE" },
    { label: "Apartments",  href: "/properties?type=APARTMENT" },
    { label: "Villas",      href: "/properties?type=VILLA" },
    { label: "Commercial",  href: "/properties?type=COMMERCIAL" },
  ],
  "AI Features": [
    { label: "AI Recommendations", href: "/dashboard/recommendations" },
    { label: "Price Prediction",    href: "/price-prediction" },
    { label: "AI Assistant",        href: "/ai-assistant" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#07111F] text-[#94A3B8] border-t border-[#C89B3C]/20">

      {/* ── Newsletter bar ── */}
      <div className="bg-gradient-to-r from-[#0B1728] via-[#0E1D33] to-[#0B1728] border-b border-[#C89B3C]/20">
        <div className="section-container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>✦ VIP Real Estate Insights</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#FCFBF7] font-serif tracking-tight">
                Stay Ahead of the Somali Property Market
              </h3>
              <p className="text-[#94A3B8] text-sm mt-1">
                Subscribe to receive new verified listings, off-market opportunities, and AI market predictions.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-xl bg-[#07111F]/80 border border-[#E8E1D4]/20 text-[#FCFBF7] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] font-bold text-sm hover:brightness-105 shadow-md shadow-[#C89B3C]/20 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div className="section-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <BrandLogo variant="dark" size="lg" />
            </div>
            <p className="text-sm leading-relaxed text-[#94A3B8] mb-6 max-w-sm">
              Kiro-Maal Real Estate is Somalia&apos;s premier luxury property platform. Discover verified properties, unlock AI-driven valuations, and find your dream home with unmatched trust and precision.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#C89B3C] flex-shrink-0" />
                <span className="text-[#E2E8F0]">Wadajir &amp; Hodan Districts, Mogadishu, Somalia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#C89B3C] flex-shrink-0" />
                <span className="text-[#E2E8F0]">+252 61 200 0000 / +252 61 900 0000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#C89B3C] flex-shrink-0" />
                <span className="text-[#E2E8F0]">concierge@kiro-maal.so</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-[#0B1728] border border-[#C89B3C]/20 flex items-center justify-center text-[#94A3B8] hover:bg-gradient-to-r hover:from-[#C89B3C] hover:to-[#D9B45B] hover:text-[#07111F] hover:border-transparent transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-bold text-[#FCFBF7] text-sm mb-4 tracking-wide uppercase font-serif">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#94A3B8] hover:text-[#D9B45B] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#0B1728] bg-[#050C16]">
        <div className="section-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} Kiro-Maal Real Estate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[#D9B45B] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#D9B45B] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#D9B45B] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
