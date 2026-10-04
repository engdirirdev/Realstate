"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, Search, ChevronDown, User, LogOut, Heart,
  LayoutDashboard, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";

const referenceNavLinks = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/properties?status=APPROVED", label: "Buy" },
  { href: "/properties?priceMax=5000", label: "Rent" },
  { href: "/dashboard/properties/add", label: "Sell" },
  { href: "/about#team", label: "Agents" },
  { href: "/ai-assistant", label: "AI Features" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";
  const isCustomer = session?.user?.role === "CUSTOMER";
  const isManager = session?.user?.role === "USER";

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-white/95 backdrop-blur-md border-b border-[#DCE6F2]",
        scrolled ? "shadow-xs" : ""
      )}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <BrandLogo variant="light" size="md" />

          {/* ── Desktop Nav ── */}
          <div className="hidden xl:flex items-center gap-1">
            {referenceNavLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "text-[#1677FF] font-semibold"
                      : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F5F8FC]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Right Auth & Search ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/properties"
              aria-label="Search properties"
              className="w-9 h-9 rounded-full bg-[#F5F8FC] hover:bg-[#EDF3FA] border border-[#DCE6F2] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <Search className="w-4 h-4" />
            </Link>

            {status === "loading" ? (
              <div className="h-9 w-24 rounded-xl bg-[#F1F5F9] animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#DCE6F2] transition-all group">
                    <Avatar className="h-8 w-8 ring-2 ring-[#BFDBFE]">
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback className="text-xs bg-[#EFF6FF] text-[#1677FF] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-bold text-[#0F172A] leading-none">
                        {session.user?.name?.split(" ")[0]}
                      </span>
                      <span className="text-[10px] text-[#1677FF] font-semibold capitalize mt-0.5">
                        {session.user?.role?.toLowerCase()}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-[#DCE6F2] shadow-card-hover p-1.5">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-bold text-[#0F172A]">{session.user?.name}</p>
                      <p className="text-xs text-[#64748B] truncate">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#EDF3FA]" />
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 text-[#1677FF]" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : isCustomer ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/customer" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-[#1677FF]" /> Customer Portal
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/customer/favorites" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                          <Heart className="h-4 w-4 text-[#EF4444]" /> Saved Favorites
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/customer/profile" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                          <User className="h-4 w-4 text-[#64748B]" /> Profile Settings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-[#1677FF]" /> Manager Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="flex items-center gap-2 text-[#0F172A] cursor-pointer">
                          <User className="h-4 w-4 text-[#64748B]" /> Profile Settings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-[#EDF3FA]" />
                  <DropdownMenuItem
                    className="text-[#EF4444] focus:text-[#DC2626] focus:bg-[#FEE2E2] cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#0F172A] hover:bg-[#F5F8FC] font-semibold text-sm px-3.5">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-[#1677FF] hover:bg-[#0F5ED7] text-white font-semibold rounded-xl text-sm px-4 shadow-xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            className="xl:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="xl:hidden py-4 border-t border-[#DCE6F2] animate-fade-in bg-white">
            <div className="flex flex-col gap-1">
              {referenceNavLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#475569] hover:text-[#1677FF] hover:bg-[#F5F8FC]"
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-[#EDF3FA] pt-3 mt-2 flex flex-col gap-2 px-3">
                {session ? (
                  <Link
                    href={isAdmin ? "/admin" : isCustomer ? "/customer" : "/dashboard"}
                    className="btn-primary text-center text-sm py-2 rounded-xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to Portal
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center text-sm py-2">
                      Login
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm py-2">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
