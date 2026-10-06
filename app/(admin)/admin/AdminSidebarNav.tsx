"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Plus,
  FolderTree,
  MapPin,
  Users,
  UserCheck,
  CreditCard,
  MessageSquare,
  Calendar,
  BarChart3,
  ScrollText,
  Settings,
  History,
  BadgeDollarSign,
  Key,
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

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTY MANAGEMENT",
    items: [
      { href: "/admin/properties", label: "All Properties", icon: Building2 },
      { href: "/admin/properties/add", label: "Add Property", icon: Plus },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    title: "TRANSACTIONS & SETTLEMENTS",
    items: [
      { href: "/admin/sales", label: "Sales Management", icon: BadgeDollarSign },
      { href: "/admin/requests", label: "Rentals & Leases", icon: Key },
      { href: "/admin/transactions", label: "Payments & Transactions", icon: CreditCard },
    ],
  },
  {
    title: "CLIENT ENGAGEMENT",
    items: [
      { href: "/admin/bookings", label: "Tour Bookings", icon: Calendar },
      { href: "/admin/messages", label: "Contact Inquiries", icon: MessageSquare },
    ],
  },
  {
    title: "USERS & CLIENTS",
    items: [
      { href: "/admin/users?role=CUSTOMER", label: "Customers", icon: Users },
      { href: "/admin/users?role=USER", label: "Managers", icon: UserCheck },
    ],
  },
  {
    title: "SYSTEM & INTELLIGENCE",
    items: [
      { href: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3.5 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {navGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-bold text-[#C49E58] uppercase tracking-[0.12em] mb-2 font-mono">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (label === "Dashboard" && pathname === "/admin") ||
              (href === "/admin/transactions" && (pathname === "/admin/transactions" || pathname === "/admin/payments"));
            return (
              <Link
                key={href + label}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#D9A336] via-[#E8B849] to-[#C99126] text-[#0B1523] font-bold shadow-md shadow-[#C99126]/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-[#0B1523] scale-110"
                      : "text-[#D9A336] group-hover:text-[#E8B849] group-hover:scale-110"
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
