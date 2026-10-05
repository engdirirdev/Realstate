"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Heart,
  Sliders,
  MessageSquare,
  Calendar,
  Mail,
  TrendingUp,
  Sparkles,
  Bot,
  User,
  CreditCard,
  Bookmark,
  Star,
  Headphones,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavGroup {
  title?: string;
  items: {
    href: string;
    label: string;
    icon: any;
  }[];
}

const customerNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    items: [
      { href: "/customer/properties", label: "Browse Properties", icon: Building2 },
      { href: "/customer/favorites", label: "Saved Favorites", icon: Heart },
      { href: "/customer/saved-searches", label: "Saved Searches", icon: Bookmark },
      { href: "/customer/compare", label: "Compare Properties", icon: Sliders },
    ],
  },
  {
    title: "TOURS & INQUIRIES",
    items: [
      { href: "/customer/bookings", label: "My Appointments", icon: Calendar },
      { href: "/customer/inquiries", label: "My Inquiries", icon: MessageSquare },
      { href: "/customer/contact", label: "VIP Concierge", icon: Headphones },
      { href: "/customer/notifications", label: "Messages & Alerts", icon: Mail },
      { href: "/customer/reviews", label: "My Reviews", icon: Star },
    ],
  },
  {
    title: "DEALS & TRANSACTIONS",
    items: [
      { href: "/customer/transactions", label: "My Transactions & Requests", icon: Receipt },
      { href: "/customer/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "AI & ANALYTICS",
    items: [
      { href: "/customer/predictions", label: "Price Prediction", icon: TrendingUp },
      { href: "/customer/recommendations", label: "Recommendations", icon: Sparkles },
      { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/customer/profile", label: "My Profile & Settings", icon: User },
    ],
  },
];

export default function CustomerSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {customerNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#C89B3C]/80 uppercase tracking-widest mb-2 font-serif">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            if (href === "/ai-assistant") {
              return (
                <button
                  key={label + href}
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("open-ai-chat"));
                    }
                  }}
                  className="w-full text-left group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-white/80 hover:text-white hover:bg-white/5 active:bg-white/10 cursor-pointer"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 text-[#D9B45B] group-hover:text-[#F3D78A] group-hover:scale-110" />
                  <span className="truncate">{label}</span>
                </button>
              );
            }

            const isActive = pathname === href || (label === "Dashboard" && pathname === "/customer");
            return (
              <Link
                key={label + href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-extrabold shadow-lg shadow-[#C89B3C]/25"
                    : "text-white/80 hover:text-white hover:bg-white/5 active:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-[#07111F] scale-110"
                      : "text-[#D9B45B] group-hover:text-[#F3D78A] group-hover:scale-110"
                  )}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
