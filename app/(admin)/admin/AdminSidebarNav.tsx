"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  FolderTree,
  Sliders,
  Users,
  UserCheck,
  Shield,
  CreditCard,
  MessageSquare,
  Calendar,
  TrendingUp,
  Sparkles,
  BarChart3,
  BookOpen,
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
      { href: "/dashboard/properties/add", label: "Add Property", icon: PlusCircle },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/locations", label: "Features", icon: Sliders },
    ],
  },
  {
    title: "USERS",
    items: [
      { href: "/admin/users?role=CUSTOMER", label: "Customers", icon: Users },
      { href: "/admin/users?role=USER", label: "Agents", icon: UserCheck },
      { href: "/admin/users?role=ADMIN", label: "Owners", icon: Shield },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/messages", label: "Requests", icon: MessageSquare },
      { href: "/admin/bookings", label: "Appointments", icon: Calendar },
    ],
  },
  {
    title: "AI & ANALYTICS",
    items: [
      { href: "/price-prediction", label: "Price Prediction", icon: TrendingUp },
      { href: "/customer/recommendations", label: "Recommendations", icon: Sparkles },
      { href: "/admin/analytics", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    items: [
      { href: "/about", label: "Blog", icon: BookOpen },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {navGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#38BDF8]/80 uppercase tracking-wider mb-2">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (label === "Dashboard" && pathname === "/admin");
            return (
              <Link
                key={href + label}
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
