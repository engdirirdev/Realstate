"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, Home, Building2, Info, Phone, Bot, LogIn,
  ChevronDown, User, Settings, LogOut, Heart, BarChart3,
  Sparkles, LayoutDashboard, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const publicNavLinks = [
  { href: "/",               label: "Home",       icon: Home },
  { href: "/properties",     label: "Properties", icon: Building2 },
  { href: "/about",          label: "About",      icon: Info },
  { href: "/contact",        label: "Contact",    icon: Phone },
];

const userNavLinks = [
  { href: "/dashboard",       label: "Dashboard",       icon: LayoutDashboard },
  { href: "/properties",      label: "Properties",      icon: Building2 },
  { href: "/ai-assistant",    label: "AI Assistant",    icon: Bot },
  { href: "/price-prediction",label: "Price Prediction",icon: BarChart3 },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";
  const isUser  = session?.user?.role === "USER";
  const navLinks = isUser ? userNavLinks : publicNavLinks;

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-white border-b border-[#E2E8F0]",
        scrolled ? "shadow-sm" : ""
      )}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center group-hover:bg-[#059669] transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base text-[#0F172A] tracking-tight">
                AI RealEstate
              </span>
              <span className="text-[10px] text-[#059669] font-medium tracking-wide -mt-0.5">
                Smart Property Search
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === href
                    ? "text-[#059669] bg-[#ECFDF5]"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="hidden md:flex items-center gap-2">
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-xl bg-[#F1F5F9] animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all group">
                    <Avatar className="h-8 w-8 ring-2 ring-[#E2E8F0]">
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback className="text-xs bg-[#D1FAE5] text-[#065F46] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-[#0F172A] leading-none">
                        {session.user?.name?.split(" ")[0]}
                      </span>
                      <span className="text-[10px] text-[#10B981] font-medium capitalize">
                        {session.user?.role?.toLowerCase()}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-[#E2E8F0] shadow-card-hover">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-semibold text-[#0F172A]">{session.user?.name}</p>
                      <p className="text-xs text-[#64748B]">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#E2E8F0]" />
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-[#0F172A]">
                        <LayoutDashboard className="h-4 w-4 text-[#10B981]" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : session.user?.role === "CUSTOMER" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/customer" className="flex items-center gap-2 text-[#0F172A]">
                          <LayoutDashboard className="h-4 w-4 text-[#0891B2]" /> Customer Portal
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/customer/favorites" className="flex items-center gap-2 text-[#0F172A]">
                          <Heart className="h-4 w-4 text-[#DC2626]" /> Saved Favorites
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/customer/profile" className="flex items-center gap-2 text-[#0F172A]">
                          <User className="h-4 w-4 text-[#64748B]" /> AI Preferences
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 text-[#0F172A]">
                          <LayoutDashboard className="h-4 w-4 text-[#10B981]" /> Agent / Manager Portal
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="flex items-center gap-2 text-[#0F172A]">
                          <User className="h-4 w-4 text-[#64748B]" /> Profile Settings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-[#E2E8F0]" />
                  <DropdownMenuItem
                    className="text-[#EF4444] focus:text-[#DC2626] focus:bg-[#FEE2E2] cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#0F172A] gap-1.5">
                    <LogIn className="h-4 w-4" /> Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gap-1.5">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#E2E8F0] animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    pathname === href
                      ? "text-[#059669] bg-[#ECFDF5]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
                {session ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-[#D1FAE5] text-[#065F46] font-semibold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{session.user?.name}</p>
                        <p className="text-xs text-[#64748B]">{session.user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="mx-2 text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2]"
                      onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
