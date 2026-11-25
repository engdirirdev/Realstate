"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  BarChart3,
  ScrollText,
  Settings,
  BadgeDollarSign,
  FileText,
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

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", labelSo: "Xarunta Guud", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTY MANAGEMENT",
    titleSo: "MAAMULKA GURYAHA",
    items: [
      { href: "/admin/properties", label: "All Properties", labelSo: "Dhammaan Guryaha", icon: Building2 },
      { href: "/admin/properties/add", label: "Add Property", labelSo: "Ku Dar Guri", icon: Plus },
      { href: "/admin/categories", label: "Categories", labelSo: "Qaybaha", icon: FolderTree },
      { href: "/admin/locations", label: "Locations", labelSo: "Goobaha", icon: MapPin },
    ],
  },
  {
    title: "TRANSACTIONS & SETTLEMENTS",
    titleSo: "HESHIISYADA & LACAGTA",
    items: [
      { href: "/admin/sales", label: "Purchase Requests & Sales", labelSo: "Codsiyada Iibka", icon: BadgeDollarSign },
      { href: "/admin/bookings", label: "Bookings & Rents", labelSo: "Ballamaha & Kirada", icon: FileText },
      { href: "/admin/transactions", label: "Payments & Transactions", labelSo: "Lacag-Bixinta", icon: CreditCard },
    ],
  },
  {
    title: "CLIENT ENGAGEMENT",
    titleSo: "XIRIIRKA MACAAMIISHA",
    items: [
      { href: "/admin/messages", label: "Messages & Inquiries", labelSo: "Farriimaha", icon: MessageSquare },
    ],
  },
  {
    title: "USERS & CLIENTS",
    titleSo: "ISTICMAALAYAASHA",
    items: [
      { href: "/admin/users?role=CUSTOMER", label: "Customers", labelSo: "Macaamiisha", icon: Users },
      { href: "/admin/users?role=USER", label: "Managers", labelSo: "Maamulayaasha", icon: UserCheck },
    ],
  },
  {
    title: "SYSTEM & INTELLIGENCE",
    titleSo: "NIDAAMKA & CAQLIGA",
    items: [
      { href: "/admin/analytics", label: "Platform Analytics", labelSo: "Falanqaynta", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit Logs", labelSo: "Diiwaanka Amniga", icon: ScrollText },
      { href: "/admin/profile", label: "Profile", labelSo: "Xogta Shaqsiga", icon: User },
      { href: "/admin/settings", label: "Settings", labelSo: "Dejinta", icon: Settings },
    ],
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [lang] = usePortalLanguage();

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
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
    <nav suppressHydrationWarning className="flex-1 px-3.5 py-2 space-y-4 overflow-y-auto scrollbar-hide">
      {navGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-bold text-[#C49E58] uppercase tracking-[0.12em] mb-2 font-mono">
              {isSo ? group.titleSo || group.title : group.title}
            </p>
          )}
          {group.items.map(({ href, label, labelSo, icon: Icon }) => {
            const isActive =
              currentPath === href ||
              (label === "Dashboard" && currentPath === "/admin") ||
              (href === "/admin/sales" && (currentPath === "/admin/sales" || currentPath === "/admin/requests")) ||
              (href === "/admin/transactions" && (currentPath === "/admin/transactions" || currentPath === "/admin/payments")) ||
              (href === "/admin/bookings" && (currentPath === "/admin/bookings" || currentPath === "/admin/rentals"));
            return (
              <Link
                key={href + label}
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
                    "h-4 w-4 shrink-0 transition-transform duration-200",
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
