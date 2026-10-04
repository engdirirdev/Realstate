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
  Settings,
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
      { href: "/properties", label: "Browse Properties", icon: Building2 },
      { href: "/customer/favorites", label: "Saved Favorites", icon: Heart },
      { href: "/properties/compare", label: "Compare Properties", icon: Sliders },
    ],
  },
  {
    title: "TOURS & INQUIRIES",
    items: [
      { href: "/customer/bookings", label: "My Appointments", icon: Calendar },
      { href: "/customer/inquiries", label: "My Inquiries", icon: MessageSquare },
      { href: "/customer/notifications", label: "Messages & Alerts", icon: Mail },
    ],
  },
  {
    title: "AI & ANALYTICS",
    items: [
      { href: "/price-prediction", label: "Price Prediction", icon: TrendingUp },
      { href: "/customer/recommendations", label: "Recommendations", icon: Sparkles },
      { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/customer/profile", label: "My Profile", icon: User },
      { href: "/customer/payments", label: "Payments", icon: CreditCard },
      { href: "/customer/profile", label: "Settings", icon: Settings },
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
