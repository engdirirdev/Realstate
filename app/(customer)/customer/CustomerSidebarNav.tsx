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
            <p className="px-3 text-[10px] font-extrabold text-[#38BDF8]/80 uppercase tracking-wider mb-2">
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
                    ? "bg-gradient-to-r from-[#1677FF] to-[#0F5ED7] text-white font-bold shadow-lg shadow-[#1677FF]/35 border-l-4 border-[#38BDF8]"
                    : "text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                      : "text-[#7DD3FC] group-hover:text-white group-hover:scale-110"
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
