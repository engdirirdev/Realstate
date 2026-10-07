"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Heart,
  FileText,
  Key,
  ShoppingBag,
  CreditCard,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Bell,
  User,
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
    title: "MAIN",
    items: [
      { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    items: [
      { href: "/customer/properties", label: "Browse Properties", icon: Building2 },
      { href: "/customer/favorites", label: "Favorites", icon: Heart },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      { href: "/customer/requests", label: "My Requests", icon: FileText },
      { href: "/customer/rentals", label: "My Rentals", icon: Key },
      { href: "/customer/purchases", label: "My Purchases", icon: ShoppingBag },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { href: "/customer/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "AI",
    items: [
      { href: "/customer/recommendations", label: "AI Recommendations", icon: Sparkles },
      { href: "/customer/predictions", label: "Price Prediction", icon: TrendingUp },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { href: "/customer/messages", label: "Messages", icon: MessageSquare },
      { href: "/customer/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/customer/profile", label: "Profile", icon: User },
      { href: "/customer/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function CustomerSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      <div className="px-3 pb-2 border-b border-[#C89B3C]/15 mb-2">
        <p className="text-[11px] font-black text-[#D9B45B] tracking-wider uppercase font-serif">
          Customer Portal
        </p>
      </div>

      {customerNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#C89B3C]/80 uppercase tracking-widest mb-1.5 font-serif">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href === "/customer" && pathname === "/customer");

            return (
              <Link
                key={label + href}
                href={href}
                prefetch={false}
                onMouseEnter={() => router.prefetch(href)}
                onPointerDown={() => router.prefetch(href)}
                onFocus={() => router.prefetch(href)}
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
