"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, MessageSquare, BarChart3, CreditCard,
  FolderTree, MapPin, ShieldAlert, Settings, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Manage Properties", icon: Building2 },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/bookings", label: "Manage Bookings", icon: Calendar },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/payments", label: "Finance & Payments", icon: CreditCard },
  { href: "/admin/messages", label: "Contact Messages", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics & AI", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldAlert },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
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
