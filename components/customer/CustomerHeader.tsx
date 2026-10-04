"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, ExternalLink } from "lucide-react";

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

  return (
    <header className="bg-[#FCFBF7] border-b border-[#E8E1D4] h-18 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Menu Trigger + Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          type="button"
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] rounded-xl transition-colors"
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
            className="w-full bg-[#FCFBF7] border border-[#E8E1D4] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#07111F] placeholder:text-[#6B7280] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 transition-all outline-hidden"
          />
        </div>
      </div>

      {/* Right: Public Site Link, Notifications & Customer Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#07111F] hover:text-[#C89B3C] bg-[#FCFBF7] hover:bg-[#F7F3EA] border border-[#E8E1D4] px-3 py-1.5 rounded-xl transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#C89B3C]" />
          <span>Public Site</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/customer/notifications"
          className="relative p-2.5 text-[#07111F] hover:text-[#C89B3C] hover:bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC2626] border-2 border-white rounded-full animate-pulse" />
          )}
        </Link>

        {/* Customer Profile Pill */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#E8E1D4]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C89B3C] to-[#D9B45B] flex items-center justify-center text-[#07111F] font-bold text-sm shadow-xs overflow-hidden flex-shrink-0 ring-2 ring-[#C89B3C]/30">
            {userImage ? (
              <img src={userImage} alt={userName || "Customer"} className="w-full h-full object-cover" />
            ) : (
              userName?.charAt(0).toUpperCase() || "C"
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#07111F] leading-tight truncate max-w-[120px]">
              {userName || "Customer"}
            </p>
            <p className="text-[10px] font-bold text-[#A97918] uppercase tracking-wider">
              Client Portal
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
