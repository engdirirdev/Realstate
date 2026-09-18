"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Heart, Bot, BarChart3, Calendar, CreditCard, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const customerNavItems = [
  { href: "/customer", label: "Overview", icon: LayoutDashboard },
  { href: "/properties", label: "Browse Properties", icon: Building2 },
  { href: "/customer/favorites", label: "Saved Properties", icon: Heart },
  { href: "/customer/saved-searches", label: "Saved Searches", icon: Settings },
  { href: "/customer/recommendations", label: "AI Recommendations", icon: Bot },
  { href: "/customer/predictions", label: "Price Prediction", icon: BarChart3 },
  { href: "/customer/bookings", label: "My Bookings", icon: Calendar },
  { href: "/customer/payments", label: "Payment History", icon: CreditCard },
  { href: "/customer/reviews", label: "My Reviews", icon: Heart },
  { href: "/properties/compare", label: "Compare Properties", icon: Building2 },
  { href: "/customer/profile", label: "Profile Settings", icon: Settings },
];

export default function CustomerSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {customerNavItems.map(({ href, label, icon: Icon }) => {
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
