"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, ExternalLink } from "lucide-react";

interface AdminHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  unreadCount?: number;
}

export default function AdminHeader({
  userName = "Admin",
  userEmail = "admin@realestate.so",
  userImage,
  unreadCount = 3,
}: AdminHeaderProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="bg-white border-b border-[#DCE6F2] h-18 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Menu Trigger + Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          type="button"
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F5F8FC] rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
          <input
            type="text"
            placeholder="Search properties, customers, transactions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E2DDD1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] font-medium focus:bg-white focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 transition-all outline-hidden"
          />
        </div>
      </div>

      {/* Right: Public Site Link, Notifications & Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#1677FF] bg-[#FAF7F2] hover:bg-white border border-[#E2DDD1] px-3.5 py-2 rounded-xl transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Public Site</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/admin/messages"
          className="relative p-2.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#FAF7F2] rounded-xl border border-[#E2DDD1] transition-colors"
          title="Notifications & Messages"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] border-2 border-white rounded-full animate-pulse" />
          )}
        </Link>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#DCE6F2]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1677FF] to-[#38BDF8] flex items-center justify-center text-white font-extrabold text-sm shadow-xs overflow-hidden flex-shrink-0">
            {userImage ? (
              <img src={userImage} alt={userName || "Admin"} className="w-full h-full object-cover" />
            ) : (
              userName?.charAt(0).toUpperCase() || "A"
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#0F172A] leading-tight truncate max-w-[130px]">
              {userName || "Admin"}
            </p>
            <p className="text-[10px] font-bold text-[#1677FF] uppercase tracking-wider mt-0.5">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
