"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Settings,
  Shield,
  LogOut,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminSidebarNav from "@/app/(admin)/admin/AdminSidebarNav";
import BrandLogo from "@/components/layout/BrandLogo";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initial = userName?.charAt(0).toUpperCase() || "A";

  return (
    <>
      <header className="bg-[#FCFBF7]/95 backdrop-blur-md border-b border-[#E8E1D4] h-[72px] min-h-[72px] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-all">
        {/* Left: Mobile Trigger + Search Input */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 text-[#475569] hover:text-[#07111F] hover:bg-[#F4EFE6] rounded-xl transition-all border border-transparent hover:border-[#E8E1D4]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] pointer-events-none transition-colors" />
            <input
              type="text"
              placeholder="Search properties, users, bookings..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-white hover:bg-[#FCFBF7] border border-[#E8E1D4] focus:border-[#C89B3C] focus:bg-white rounded-xl pl-10 pr-12 py-2 text-xs sm:text-sm text-[#07111F] placeholder:text-[#94A3B8] font-medium shadow-xs focus:ring-2 focus:ring-[#C89B3C]/15 transition-all outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-[#8C7A6B] bg-[#F7F3EA] px-1.5 py-0.5 rounded-md border border-[#E8E1D4]/80">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right: Public Site Link, Notifications & Admin Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Public Website Button */}
          <Link
            href="/"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#07111F] hover:text-[#C89B3C] bg-white hover:bg-[#F7F3EA] border border-[#E8E1D4] px-3.5 py-2 rounded-xl transition-all shadow-xs group"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#C89B3C] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Public Site</span>
          </Link>

          {/* Notifications Button */}
          <Link
            href="/admin/messages"
            className="relative p-2.5 text-[#07111F] hover:text-[#C89B3C] bg-white hover:bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] transition-all shadow-xs"
            title="Notifications & Contact Inquiries"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#FCFBF7] shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Real Functional Admin Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-[#E8E1D4] cursor-pointer group outline-none"
              >
                <Avatar className="h-9 w-9 ring-2 ring-[#C89B3C]/30 group-hover:ring-[#C89B3C] transition-all">
                  {userImage && (
                    <AvatarImage src={userImage} alt={userName || "Admin"} />
                  )}
                  <AvatarFallback className="text-xs bg-gradient-to-tr from-[#C99126] to-[#E8B849] text-white font-extrabold shadow-inner">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                  <span className="text-xs font-bold text-[#07111F] group-hover:text-[#C89B3C] transition-colors truncate max-w-[130px]">
                    {userName}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wider bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4]/90">
                    SUPER ADMIN
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:text-[#07111F] transition-colors hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 bg-[#FCFBF7] border border-[#E8E1D4] shadow-xl p-1.5 rounded-2xl animate-in fade-in-50 zoom-in-95"
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-[#07111F]">
                      {userName}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FAF1DF] text-[#A97918] border border-[#E8E1D4]">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] truncate font-medium">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#E8E1D4]" />

              <DropdownMenuItem asChild>
                <Link
                  href="/admin/properties"
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <Building2 className="h-4 w-4 text-[#C89B3C]" />
                  Manage Properties
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4 text-[#C89B3C]" />
                  System Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <Shield className="h-4 w-4 text-[#C89B3C]" />
                  Security & Audit Logs
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] hover:text-[#C89B3C] rounded-xl px-2.5 py-2 cursor-pointer transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-[#6B7280]" />
                  View Public Website
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
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B1523] shadow-2xl">
            <div className="h-18 px-5 border-b border-[#1B2738] flex items-center justify-between bg-[#0B1523]">
              <BrandLogo variant="dark" href="/admin" size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto scrollbar-hide py-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              <AdminSidebarNav />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
