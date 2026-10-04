import Link from "next/link";
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About Us",  href: "/about" },
    { label: "Contact",   href: "/contact" },
    { label: "Blog",      href: "#" },
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
    <footer className="bg-[#0F172A] text-[#94A3B8]">

      {/* ── Newsletter bar ── */}
      <div className="bg-[#10B981]">
        <div className="section-container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Get Property Alerts
              </h3>
              <p className="text-[#D1FAE5] text-sm mt-1">
                Subscribe to receive new listings and AI insights
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button className="px-5 py-2.5 rounded-xl bg-white text-[#059669] font-semibold text-sm hover:bg-[#F0FDFA] transition-colors flex items-center gap-2 whitespace-nowrap">
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
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AI RealEstate</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#94A3B8] mb-6 max-w-xs">
              Somalia&apos;s first AI-powered real estate platform. Discover properties, get intelligent recommendations, and predict prices with machine learning.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#10B981] flex-shrink-0" />
                <span>Hodan District, Mogadishu, Somalia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#10B981] flex-shrink-0" />
                <span>+252 61 200 0000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#10B981] flex-shrink-0" />
                <span>hello@airealestate.so</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-[#1E293B] flex items-center justify-center text-[#64748B] hover:bg-[#10B981] hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-semibold text-white text-sm mb-4 tracking-wide">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#94A3B8] hover:text-[#10B981] transition-colors"
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
      <div className="border-t border-[#1E293B]">
        <div className="section-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} AI RealEstate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[#94A3B8] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#94A3B8] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#94A3B8] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
