"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  MessageSquare,
  TrendingUp,
  Sparkles,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  FileText,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalLanguage } from "@/lib/customer-i18n";

interface NavGroup {
  title?: string;
  titleSo?: string;
  items: {
    href: string;
    label: string;
    labelSo: string;
    icon: any;
  }[];
}

const managerNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", labelSo: "Xarunta Guud", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    titleSo: "GURYAHA",
    items: [
      { href: "/dashboard/properties", label: "All Properties", labelSo: "Dhammaan Guryaha", icon: Building2 },
      { href: "/dashboard/properties/add", label: "Add Property", labelSo: "Ku Dar Guri", icon: PlusCircle },
    ],
  },
  {
    title: "CLIENTS & LEADS",
    titleSo: "MACAAMIISHA",
    items: [
      { href: "/dashboard/customers", label: "Customers", labelSo: "Macaamiisha", icon: Users },
      { href: "/dashboard/inquiries", label: "Inquiries & Leads", labelSo: "Farriimaha", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Alerts & Notifications", labelSo: "Ogeysiisyada", icon: Bell },
    ],
  },
  {
    title: "TRANSACTIONS",
    titleSo: "HESHIISYADA",
    items: [
      { href: "/dashboard/bookings", label: "Bookings & Rents", labelSo: "Ballamaha & Kirada", icon: FileText },
      { href: "/dashboard/transactions", label: "Payments", labelSo: "Lacag-Bixinta", icon: CreditCard },
    ],
  },
  {
    title: "AI & ANALYTICS",
    titleSo: "CAQLIGA AI",
    items: [
      { href: "/dashboard/predictions", label: "Price Prediction", labelSo: "Qiimeynta AI", icon: TrendingUp },
      { href: "/dashboard/recommendations", label: "Recommendations", labelSo: "Talooyinka AI", icon: Sparkles },
      { href: "/dashboard/analytics", label: "Portfolio Analytics", labelSo: "Falanqaynta", icon: BarChart3 },
    ],
  },
  {
    title: "ACCOUNT",
    titleSo: "AKOONKA",
    items: [
      { href: "/dashboard/profile", label: "Profile", labelSo: "Xogta Shaqsiga", icon: User },
      { href: "/dashboard/settings", label: "Settings", labelSo: "Dejinta", icon: Settings },
    ],
  },
];

export default function DashboardSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [lang] = usePortalLanguage();

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    const allHrefs = managerNavGroups.flatMap((g) => g.items.map((i) => i.href));
    const timers: NodeJS.Timeout[] = [];
    allHrefs.forEach((href, idx) => {
      if (href !== pathname) {
        const t = setTimeout(() => {
          router.prefetch(href);
        }, 800 + idx * 220);
        timers.push(t);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [router, pathname]);

  const currentPath = optimisticPath || pathname;
  const isSo = lang === "so";

  return (
    <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {managerNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#C89B3C]/80 uppercase tracking-widest mb-2 font-serif">
              {isSo ? group.titleSo || group.title : group.title}
            </p>
          )}
          {group.items.map(({ href, label, labelSo, icon: Icon }) => {
            const isActive =
              currentPath === href ||
              (label === "Dashboard" && currentPath === "/dashboard") ||
              (href === "/dashboard/customers" && currentPath?.startsWith("/dashboard/customers")) ||
              (href === "/dashboard/bookings" && (currentPath === "/dashboard/bookings" || currentPath === "/dashboard/rentals")) ||
              (href === "/dashboard/transactions" && (currentPath === "/dashboard/transactions" || currentPath === "/dashboard/payments"));
            return (
              <Link
                key={label + href}
                href={href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(href)}
                onFocus={() => router.prefetch(href)}
                onClick={() => setOptimisticPath(href)}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] text-[#0B1728] font-bold shadow-md shadow-[#D6A536]/25"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-[#0B1728] scale-110"
                      : "text-[#D6A536] group-hover:text-[#E5BE5C] group-hover:scale-110"
                  )}
                />
                <span className="truncate">{isSo ? labelSo : label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
