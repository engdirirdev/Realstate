import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import { prisma } from "@/lib/prisma";

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

async function getFooterBrandSettings() {
  const defaults = {
    siteName: "Kiro-Maal Real Estate",
    description:
      "Kiro-Maal Real Estate is Abudwak's premier luxury property platform. Discover verified properties, unlock AI-driven valuations, and find your dream home with unmatched trust and precision.",
    address: "Abudwak, Galmudug, Somalia",
    phone: "+252 61 200 0000 / +252 61 900 0000",
    email: "concierge@kiro-maal.so",
    facebook: "#",
    twitter: "#",
    instagram: "#",
    linkedin: "#",
  };

  try {
    const rows = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "site_name",
            "company_description",
            "contact_address",
            "contact_phone",
            "contact_email",
            "social_facebook",
            "social_twitter",
            "social_instagram",
            "social_linkedin",
          ],
        },
      },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return {
      siteName: map.site_name?.trim() || defaults.siteName,
      description: map.company_description?.trim() || defaults.description,
      address: map.contact_address?.trim() || defaults.address,
      phone: map.contact_phone?.trim() || defaults.phone,
      email: map.contact_email?.trim() || defaults.email,
      facebook: map.social_facebook?.trim() || defaults.facebook,
      twitter: map.social_twitter?.trim() || defaults.twitter,
      instagram: map.social_instagram?.trim() || defaults.instagram,
      linkedin: map.social_linkedin?.trim() || defaults.linkedin,
    };
  } catch {
    return defaults;
  }
}

export default async function Footer() {
  const brand = await getFooterBrandSettings();
  const socials = [
    { Icon: Facebook, href: brand.facebook, label: "Facebook" },
    { Icon: Twitter, href: brand.twitter, label: "Twitter / X" },
    { Icon: Instagram, href: brand.instagram, label: "Instagram" },
    { Icon: Linkedin, href: brand.linkedin, label: "LinkedIn" },
  ];

  return (
    <footer className="bg-[#0B1728] text-[#94A3B8] border-t border-[#D6A536]/25">

      {/* ── Newsletter bar ── */}
      <div className="bg-[#0E1D33] border-b border-[#D6A536]/20">
        <div className="section-container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D6A536]/15 border border-[#D6A536]/35 text-[#D6A536] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>✦ VIP Real Estate Insights</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-tight">
                Stay Ahead of the Abudwak Property Market
              </h3>
              <p className="text-[#94A3B8] text-sm mt-1">
                Subscribe to receive new verified listings, off-market opportunities, and AI market predictions.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-xl bg-[#0B1728] border border-[#E8E1D5]/25 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#D6A536] focus:ring-1 focus:ring-[#D6A536]"
              />
              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] text-[#0B1728] font-bold text-sm hover:brightness-105 shadow-md shadow-[#D6A536]/20 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
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
              {brand.description}
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#D6A536] flex-shrink-0" />
                <span className="text-[#E2E8F0]">{brand.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#D6A536] flex-shrink-0" />
                <span className="text-[#E2E8F0]">{brand.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#D6A536] flex-shrink-0" />
                <a href={`mailto:${brand.email}`} className="text-[#E2E8F0] hover:text-[#D6A536] transition-colors">
                  {brand.email}
                </a>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {socials.map(({ Icon, href, label }) => {
                const isExternal = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-[#D6A536]/25 flex items-center justify-center text-[#94A3B8] hover:bg-gradient-to-r hover:from-[#D6A536] hover:to-[#E2B952] hover:text-[#0B1728] hover:border-transparent transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-bold text-white text-sm mb-4 tracking-wide uppercase font-serif">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      prefetch={true}
                      className="text-sm text-[#94A3B8] hover:text-[#D6A536] transition-colors"
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
      <div className="border-t border-white/10 bg-[#081220]">
        <div className="section-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} {brand.siteName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[#D6A536] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#D6A536] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#D6A536] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
