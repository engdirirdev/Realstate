"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, ExternalLink, ChevronDown } from "lucide-react";

interface AdminHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  unreadCount?: number;
}

export default function AdminHeader({
  userName = "Cabdullahi Axmed",
  userEmail = "admin@realestate.so",
  userImage,
  unreadCount = 5,
}: AdminHeaderProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="bg-[#F5EFEB] border-b border-[#E6DED4] h-18 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Trigger + Search Field */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          type="button"
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 text-slate-600 hover:text-[#0B1523] hover:bg-[#EAE2D8] rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search properties, customers, transactions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-[#EDE5DB] border border-[#E2D7C8] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0B1523] placeholder:text-slate-500 font-medium focus:bg-white focus:border-[#C99126] focus:ring-2 focus:ring-[#C99126]/20 transition-all outline-hidden"
          />
        </div>
      </div>

      {/* Right: Public Site, Notifications & Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Public Site Button */}
        <Link
          href="/"
<<<<<<< HEAD
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#0B1523] bg-white/70 hover:bg-white border border-[#D9CEBF] px-4 py-2 rounded-xl transition-all shadow-2xs"
=======
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#1677FF] bg-[#FAF7F2] hover:bg-white border border-[#E2DDD1] px-3.5 py-2 rounded-xl transition-colors"
>>>>>>> 772e50c8fa5f6db9761a497c04520b18a979dfb3
        >
          <ExternalLink className="h-3.5 w-3.5 text-slate-700" />
          <span>Public Site</span>
        </Link>

        {/* Notifications Bell with Red Badge "5" */}
        <Link
          href="/admin/messages"
          className="relative p-2.5 text-slate-700 hover:text-[#0B1523] hover:bg-white/60 rounded-xl border border-[#D9CEBF] transition-all bg-white/40 shadow-2xs"
          title="Notifications & Messages"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </Link>

        {/* Admin Profile Dropdown Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E6DED4] cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-[#C99126] flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0 overflow-hidden">
            {userImage ? (
              <img
                src={userImage}
                alt={userName || "Admin"}
                className="w-full h-full object-cover"
              />
            ) : (
              userName?.charAt(0).toUpperCase() || "C"
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#0B1523] leading-tight truncate max-w-[140px]">
              {userName || "Cabdullahi Axmed"}
            </p>
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">
              SUPER ADMIN
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-colors hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
