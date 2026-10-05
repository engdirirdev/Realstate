"use client";

import { Eye, Heart, CalendarCheck, Clock, ShieldCheck, Activity } from "lucide-react";

interface PropertyStatsPanelProps {
  viewCount: number;
  favoritesCount: number;
  bookingsCount: number;
  updatedAt: string | Date;
  status: string;
}

export default function PropertyStatsPanel({
  viewCount,
  favoritesCount,
  bookingsCount,
  updatedAt,
  status,
}: PropertyStatsPanelProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isVerified = status === "APPROVED";

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-[#E8E1D4] pb-3">
        <h3 className="font-serif font-bold text-sm sm:text-base text-[#07111F] flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#C89B3C]" /> Property Activity &amp; Live Stats
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30">
          Live Database Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Views */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto mb-1.5">
            <Eye className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total Views</p>
          <p className="font-serif font-black text-lg text-[#07111F] mt-0.5">
            {viewCount.toLocaleString()}
          </p>
        </div>

        {/* Total Favorites */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#07111F] text-[#DC2626] flex items-center justify-center mx-auto mb-1.5">
            <Heart className="h-3.5 w-3.5 fill-current" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Favorites</p>
          <p className="font-serif font-black text-lg text-[#07111F] mt-0.5">
            {favoritesCount.toLocaleString()}
          </p>
        </div>

        {/* Total Bookings */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#07111F] text-[#C89B3C] flex items-center justify-center mx-auto mb-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Tour Bookings</p>
          <p className="font-serif font-black text-lg text-[#07111F] mt-0.5">
            {bookingsCount.toLocaleString()}
          </p>
        </div>

        {/* Last Updated */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto mb-1.5">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Last Updated</p>
          <p className="font-bold text-xs text-[#07111F] mt-1.5 truncate">
            {formattedDate}
          </p>
        </div>

        {/* Verification Status */}
        <div className="col-span-2 sm:col-span-1 bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#07111F] text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Verification</p>
          <p className="font-bold text-xs text-emerald-800 mt-1.5 truncate">
            {isVerified ? "Verified Freehold" : status}
          </p>
        </div>
      </div>
    </div>
  );
}
