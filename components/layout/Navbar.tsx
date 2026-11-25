"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, ChevronDown, LogOut,
  LayoutDashboard, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import { usePortalLanguage } from "@/lib/customer-i18n";

// 5 Main Tabs for Public Site
const publicNavLinks = [
  { href: "/", label: "Home", labelSo: "Hoyga" },
  { href: "/properties", label: "Properties", labelSo: "Guryaha" },
  { href: "/services", label: "Services", labelSo: "Adeegyada" },
  { href: "/about", label: "About", labelSo: "Nagu Saabsan" },
  { href: "/contact", label: "Contact", labelSo: "Nala Soo Xiriir" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = usePortalLanguage();
  const isSo = lang === "so";

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userEmail = session?.user?.email?.toLowerCase() || "";
  const userRole = (session?.user?.role || "").toUpperCase();

  const isAdmin = userRole === "ADMIN" || userEmail === "admin@realestate.so";
  const isCustomer = (userRole === "CUSTOMER" || userEmail === "customer@realestate.so") && !isAdmin;
  const isManager = !isAdmin && !isCustomer && (userRole === "USER" || userRole === "MANAGER" || userRole === "AGENT" || userEmail === "manager@realestate.so");
  const roleLabel = isAdmin ? "Admin" : isManager ? "Manager" : isCustomer ? "Customer" : "User";

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-white/95 backdrop-blur-md border-b border-[#E8E1D5]",
        scrolled ? "shadow-[0_4px_20px_-6px_rgba(11,23,40,0.08)]" : ""
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <BrandLogo variant="light" size="md" />

          {/* ── Desktop Nav: 5 Main Tabs (Centered) ── */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5 absolute left-1/2 -translate-x-1/2">
            {publicNavLinks.map(({ href, label, labelSo }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "text-[#0B1728] font-bold bg-[#F5F1E8] border border-[#E8E1D5] shadow-2xs"
                      : "text-[#475569] hover:text-[#0B1728] hover:bg-[#F5F1E8]/70"
                  )}
                >
                  {isSo ? labelSo : label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Right: SOM/ENG Language Switcher + Login / Account ── */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              data-no-translate="true"
              onClick={() => setLang(isSo ? "en" : "so")}
              aria-label="Switch language between Somali and English"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F5F1E8] hover:bg-[#E8E1D5]/80 border border-[#E8E1D5] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Globe className="h-3.5 w-3.5 text-[#D6A536]" />
              <span className={cn("px-1.5 py-0.5 rounded-md transition-colors", isSo ? "bg-[#0B1728] text-[#D6A536]" : "text-[#6B7280]")}>
                SOM
              </span>
              <span className="text-[#D6A536]/60">/</span>
              <span className={cn("px-1.5 py-0.5 rounded-md transition-colors", !isSo ? "bg-[#0B1728] text-[#D6A536]" : "text-[#6B7280]")}>
                ENG
              </span>
            </button>
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-xl bg-[#F5F1E8] animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#F5F1E8] border border-transparent hover:border-[#E8E1D5] transition-all group cursor-pointer">
                      <div
                        suppressHydrationWarning
                        className="h-8 w-8 rounded-full ring-2 ring-[#D6A536]/60 overflow-hidden flex items-center justify-center text-xs bg-[#0B1728] text-[#D6A536] font-bold shrink-0"
                      >
                        {session.user?.image ? (
                          <Image src={session.user.image} alt={session.user.name || "User"} width={32} height={32} className="h-full w-full object-cover" />
                        ) : (
                          <span suppressHydrationWarning>{initials}</span>
                        )}
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xs font-bold text-[#0B1728] leading-none">
                          {session.user?.name?.split(" ")[0]}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wide bg-[#F5F1E8] text-[#98721D] border border-[#E8E1D5]">
                          {roleLabel}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-[#E8E1D5] bg-white shadow-xl p-1.5 rounded-2xl">
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-bold text-[#0B1728]">{session.user?.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#E8E1D5]" />
                    <DropdownMenuItem asChild>
                      <Link
                        href={isAdmin ? "/admin" : isCustomer ? "/customer" : "/dashboard"}
                        prefetch={true}
                        className="flex items-center gap-2 text-[#0B1728] hover:bg-[#F5F1E8] hover:text-[#98721D] rounded-xl cursor-pointer font-semibold"
                      >
                        <LayoutDashboard className="h-4 w-4 text-[#D6A536]" /> Switch to Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#E8E1D5]" />
                    <DropdownMenuItem
                      className="text-[#DC2626] focus:text-[#B91C1C] focus:bg-[#FEF2F2] rounded-xl cursor-pointer font-semibold"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] hover:brightness-105 text-[#0B1728] font-bold rounded-xl text-sm px-6 py-2 shadow-sm hover:shadow-md hover:shadow-[#D6A536]/25 border-0 transition-all cursor-pointer">
                <Link href="/login" prefetch={true}>
                  Login
                </Link>
              </Button>
            )}
          </div>

          {/* ── Mobile Right: SOM/ENG + Menu Toggle ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              data-no-translate="true"
              onClick={() => setLang(isSo ? "en" : "so")}
              aria-label="Switch language between Somali and English"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F5F1E8] border border-[#E8E1D5] text-[11px] font-bold cursor-pointer"
            >
              <span className={isSo ? "text-[#0B1728] underline decoration-[#D6A536]" : "text-[#6B7280]"}>SOM</span>
              <span className="text-[#D6A536]">/</span>
              <span className={!isSo ? "text-[#0B1728] underline decoration-[#D6A536]" : "text-[#6B7280]"}>ENG</span>
            </button>
            <button
              className="p-2 rounded-lg text-[#5F6C7B] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu: 5 Main Tabs + Login ── */}
        {mobileOpen && (
          <div id="mobile-navigation-menu" className="md:hidden py-4 border-t border-[#E8E1D5] animate-fade-in bg-white">
            <div className="flex flex-col gap-1">
              {publicNavLinks.map(({ href, label, labelSo }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      isActive
                        ? "text-[#0B1728] font-bold bg-[#F5F1E8] border border-[#E8E1D5]"
                        : "text-[#475569] hover:text-[#0B1728] hover:bg-[#F5F1E8]"
                    )}
                  >
                    {isSo ? labelSo : label}
                  </Link>
                );
              })}
              <div className="border-t border-[#E8E1D5] pt-3 mt-2 flex flex-col gap-2 px-3">
                {session ? (
                  <Link
                    href={isAdmin ? "/admin" : isCustomer ? "/customer" : "/dashboard"}
                    prefetch={true}
                    className="bg-gradient-to-r from-[#D6A536] to-[#E2B952] text-[#0B1728] text-center text-sm py-2.5 rounded-xl font-bold shadow-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to Portal ({roleLabel})
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className="bg-gradient-to-r from-[#D6A536] to-[#E2B952] text-[#0B1728] text-center text-sm py-2.5 rounded-xl font-bold shadow-sm"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
