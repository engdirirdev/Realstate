"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, PlusCircle, MessageSquare, Calendar, CreditCard, Bell, Settings, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const managerNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "My Properties", icon: Building2 },
  { href: "/dashboard/properties/add", label: "Add Property", icon: PlusCircle },
  { href: "/dashboard/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/payments", label: "Payments / Earnings", icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile Settings", icon: Settings },
];

export default function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {managerNavItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[#10B981]/15 text-[#10B981] font-semibold border-l-4 border-[#10B981] pl-2.5"
                : "text-[#CBD5E1] hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#10B981]" : "text-[#94A3B8]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
