"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  User,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerSidebarNav from "@/app/(customer)/customer/CustomerSidebarNav";
import BrandLogo from "@/components/layout/BrandLogo";

interface CustomerHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  unreadCount?: number;
}

export default function CustomerHeader({
  userName = "Customer",
  userEmail = "customer@realestate.so",
  userImage,
  unreadCount = 0,
}: CustomerHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initial = userName?.charAt(0).toUpperCase() || "C";

  return (
    <>
      <header
        suppressHydrationWarning
        className="bg-[#FCFBF7] border-b border-[#E8E1D4] h-18 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs"
      >
        {/* Left: Mobile Menu Trigger + Search Bar */}
        <div suppressHydrationWarning className="flex items-center gap-4 flex-1 max-w-md">
          <button
            type="button"
            aria-label="Open sidebar menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[#C89B3C]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918]" />
            <input
              type="text"
              placeholder="Search properties, locations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-[#FCFBF7] border border-[#E8E1D4] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#07111F] placeholder:text-[#6B7280] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right: Public Site Link, Notifications & Customer Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            prefetch={true}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#07111F] hover:text-[#C89B3C] bg-[#FCFBF7] hover:bg-[#F7F3EA] border border-[#E8E1D4] px-3 py-1.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[#C89B3C]"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#C89B3C]" />
            <span>Public Site</span>
          </Link>

          {/* Notifications */}
          <Link
            href="/customer/notifications"
            prefetch={true}
            className="relative p-2.5 text-[#07111F] hover:text-[#C89B3C] hover:bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] transition-colors focus-visible:ring-2 focus-visible:ring-[#C89B3C]"
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC2626] border-2 border-white rounded-full animate-pulse" />
            )}
          </Link>

          {/* Customer Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[#E8E1D4] cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] rounded-lg"
                aria-label="User account menu"
              >
                <div
                  suppressHydrationWarning
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C89B3C] to-[#D9B45B] flex items-center justify-center text-[#07111F] font-bold text-sm shadow-xs overflow-hidden shrink-0 ring-2 ring-[#C89B3C]/30 group-hover:ring-[#C89B3C] transition-all"
                >
                  {userImage ? (
                    <Image src={userImage} alt={userName || "Customer"} width={36} height={36} className="w-full h-full object-cover" />
                  ) : (
                    <span suppressHydrationWarning>{initial}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#07111F] leading-tight truncate max-w-[120px] group-hover:text-[#C89B3C] transition-colors">
                    {userName || "Customer"}
                  </p>
                  <p className="text-[10px] font-bold text-[#A97918] uppercase tracking-wider">
                    Client Portal
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#07111F] transition-colors hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60 bg-[#FCFBF7] border border-[#E8E1D4] shadow-xl p-1.5 rounded-2xl animate-in fade-in-50 zoom-in-95"
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-[#07111F]">{userName}</p>
                  <p className="text-[11px] text-[#6B7280] truncate font-medium">{userEmail}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#E8E1D4]" />

              <DropdownMenuItem asChild>
                <Link
                  href="/customer/profile"
                  prefetch={true}
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <User className="h-4 w-4 text-[#C89B3C]" />
                  Profile Details
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/customer/favorites"
                  prefetch={true}
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <Heart className="h-4 w-4 text-[#C89B3C]" />
                  Saved Favorites
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/customer/settings"
                  prefetch={true}
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4 text-[#C89B3C]" />
                  Account Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#E8E1D4]" />

              <DropdownMenuItem
                className="flex items-center gap-2.5 text-xs font-bold text-[#DC2626] focus:text-[#B91C1C] focus:bg-[#FEF2F2] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 text-[#DC2626]" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Customer Navigation">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#07111F] shadow-2xl">
            <div className="h-18 px-5 border-b border-[#C89B3C]/20 flex items-center justify-between bg-[#07111F]">
              <BrandLogo variant="dark" href="/customer" size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-[#C89B3C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto scrollbar-hide py-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              <CustomerSidebarNav />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
