"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, ChevronDown, User, LogOut, Heart,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";

// 5 Main Tabs for Public Site
const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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

          {/* ── Desktop Nav: 5 Main Tabs ── */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {publicNavLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => router.prefetch(href)}
                  onPointerDown={() => router.prefetch(href)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "text-[#C89B3C] font-bold bg-[#F7F3EA] shadow-2xs"
                      : "text-[#475569] hover:text-[#07111F] hover:bg-[#F7F3EA]/70"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Right: Login Button Tab / Account Dropdown ── */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-xl bg-[#F7F3EA] animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#F7F3EA] border border-transparent hover:border-[#E8E1D4] transition-all group cursor-pointer">
                      <Avatar className="h-8 w-8 ring-2 ring-[#C89B3C]/50">
                        <AvatarImage src={session.user?.image || ""} />
                        <AvatarFallback className="text-xs bg-[#F7F3EA] text-[#C89B3C] font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xs font-bold text-[#07111F] leading-none">
                          {session.user?.name?.split(" ")[0]}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wide bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4]/80">
                          {roleLabel}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-[#E8E1D4] bg-[#FCFBF7] shadow-xl p-1.5 rounded-2xl">
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-bold text-[#07111F]">{session.user?.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#E8E1D4]" />
                    {isAdmin ? (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          onMouseEnter={() => router.prefetch("/admin")}
                          onPointerDown={() => router.prefetch("/admin")}
                          className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                        >
                          <LayoutDashboard className="h-4 w-4 text-[#C89B3C]" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    ) : isCustomer ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/customer"
                            onMouseEnter={() => router.prefetch("/customer")}
                            onPointerDown={() => router.prefetch("/customer")}
                            className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                          >
                            <LayoutDashboard className="h-4 w-4 text-[#C89B3C]" /> Customer Portal
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/customer/favorites"
                            onMouseEnter={() => router.prefetch("/customer/favorites")}
                            onPointerDown={() => router.prefetch("/customer/favorites")}
                            className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                          >
                            <Heart className="h-4 w-4 text-[#C89B3C]" /> Saved Favorites
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/customer/profile"
                            onMouseEnter={() => router.prefetch("/customer/profile")}
                            onPointerDown={() => router.prefetch("/customer/profile")}
                            className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                          >
                            <User className="h-4 w-4 text-[#6B7280]" /> Profile Settings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/dashboard"
                            onMouseEnter={() => router.prefetch("/dashboard")}
                            onPointerDown={() => router.prefetch("/dashboard")}
                            className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                          >
                            <LayoutDashboard className="h-4 w-4 text-[#C89B3C]" /> Manager Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/dashboard/profile"
                            onMouseEnter={() => router.prefetch("/dashboard/profile")}
                            onPointerDown={() => router.prefetch("/dashboard/profile")}
                            className="flex items-center gap-2 text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl cursor-pointer"
                          >
                            <User className="h-4 w-4 text-[#6B7280]" /> Profile Settings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-[#E8E1D4]" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/login?switch=true"
                        onMouseEnter={() => router.prefetch("/login")}
                        onPointerDown={() => router.prefetch("/login")}
                        className="flex items-center gap-2 text-[#6B7280] hover:text-[#C89B3C] hover:bg-[#F7F3EA] rounded-xl cursor-pointer"
                      >
                        <User className="h-4 w-4 text-[#C89B3C]" /> Switch Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[#DC2626] focus:text-[#B91C1C] focus:bg-[#FEF2F2] rounded-xl cursor-pointer"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link
                href="/login"
                onMouseEnter={() => router.prefetch("/login")}
                onPointerDown={() => router.prefetch("/login")}
              >
                <Button size="sm" className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold rounded-xl text-sm px-6 py-2 shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 transition-all cursor-pointer">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            className="md:hidden p-2 rounded-lg text-[#6B7280] hover:bg-[#F7F3EA] transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* ── Mobile Menu: 5 Main Tabs + Login ── */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#E8E1D4] animate-fade-in bg-[#FCFBF7]">
            <div className="flex flex-col gap-1">
              {publicNavLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      isActive
                        ? "text-[#C89B3C] font-bold bg-[#F7F3EA]"
                        : "text-[#475569] hover:text-[#C89B3C] hover:bg-[#F7F3EA]"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="border-t border-[#E8E1D4] pt-3 mt-2 flex flex-col gap-2 px-3">
                {session ? (
                  <Link
                    href={isAdmin ? "/admin" : isCustomer ? "/customer" : "/dashboard"}
                    className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] text-center text-sm py-2 rounded-xl font-bold shadow-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to Portal ({roleLabel})
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] text-center text-sm py-2.5 rounded-xl font-bold shadow-sm"
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
