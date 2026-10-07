"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ListFilter,
  PlusCircle,
  MessageSquare,
  Calendar,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  FileText,
  History,
  KeyRound,
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

const managerNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    items: [
      { href: "/dashboard/properties", label: "All Properties", icon: Building2 },
      { href: "/dashboard/properties/add", label: "Add Property", icon: PlusCircle },
    ],
  },
  {
    title: "CLIENTS & LEADS",
    items: [
      { href: "/dashboard/inquiries", label: "Inquiries & Leads", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Alerts & Notifications", icon: Bell },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      { href: "/dashboard/bookings", label: "Rental Bookings", icon: FileText },
      { href: "/dashboard/rentals", label: "Rentals", icon: KeyRound },
      { href: "/dashboard/transactions", label: "Payments & Transactions", icon: CreditCard },
    ],
  },
  {
    title: "AI & ANALYTICS",
    items: [
      { href: "/dashboard/predictions", label: "Price Prediction", icon: TrendingUp },
      { href: "/dashboard/recommendations", label: "Recommendations", icon: Sparkles },
      { href: "/dashboard/analytics", label: "Portfolio Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { href: "/dashboard/profile", label: "Profile & Settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {managerNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#C89B3C]/80 uppercase tracking-widest mb-2 font-serif">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (label === "Dashboard" && pathname === "/dashboard") ||
              (href === "/dashboard/bookings" && pathname === "/dashboard/bookings") ||
              (href === "/dashboard/rentals" && pathname === "/dashboard/rentals") ||
              (href === "/dashboard/transactions" && (pathname === "/dashboard/transactions" || pathname === "/dashboard/payments"));
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
