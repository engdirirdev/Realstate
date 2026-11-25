"use client";

import { useEffect, useState } from "react";
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
  Calendar,
  Star,
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

const customerNavGroups: NavGroup[] = [
  {
    title: "MAIN",
    titleSo: "QAYBTA GUUD",
    items: [
      { href: "/customer", label: "Dashboard", labelSo: "Xarunta Guud", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    titleSo: "GURYAHA",
    items: [
      { href: "/customer/properties", label: "Browse Properties", labelSo: "Raadi Guryaha", icon: Building2 },
      { href: "/customer/favorites", label: "Favorites", labelSo: "Kuwa La Jecelyahay", icon: Heart },
    ],
  },
  {
    title: "TRANSACTIONS",
    titleSo: "HESHIISYADA",
    items: [
      { href: "/customer/requests", label: "My Requests", labelSo: "Codsiyadayda", icon: FileText },
      { href: "/customer/rentals", label: "My Rentals", labelSo: "Kiradayda", icon: Key },
      { href: "/customer/purchases", label: "My Purchases", labelSo: "Iibsashadayda", icon: ShoppingBag },
    ],
  },
  {
    title: "FINANCE",
    titleSo: "MAALIYADDA",
    items: [
      { href: "/customer/payments", label: "Payments", labelSo: "Lacag-Bixinta", icon: CreditCard },
    ],
  },
  {
    title: "AI",
    titleSo: "CAQLIGA AI",
    items: [
      { href: "/customer/recommendations", label: "AI Recommendations", labelSo: "Talooyinka AI", icon: Sparkles },
      { href: "/customer/predictions", label: "Price Prediction", labelSo: "Qiimeynta AI", icon: TrendingUp },
    ],
  },
  {
    title: "COMMUNICATION",
    titleSo: "XIRIIRKA",
    items: [
      { href: "/customer/messages", label: "Messages", labelSo: "Farriimaha", icon: MessageSquare },
      { href: "/customer/notifications", label: "Notifications", labelSo: "Ogeysiisyada", icon: Bell },
    ],
  },
  {
    title: "ACCOUNT",
    titleSo: "AKOONKA",
    items: [
      { href: "/customer/profile", label: "Profile", labelSo: "Xogta Shaqsiga", icon: User },
      { href: "/customer/reviews", label: "My Reviews", labelSo: "Qiimeyntayda", icon: Star },
      { href: "/customer/settings", label: "Settings", labelSo: "Dejinta", icon: Settings },
    ],
  },
];

export default function CustomerSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [lang] = usePortalLanguage();

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    const allHrefs = customerNavGroups.flatMap((g) => g.items.map((i) => i.href));
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
      <div className="px-3 pb-2 border-b border-[#C89B3C]/15 mb-2">
        <p className="text-[11px] font-black text-[#D9B45B] tracking-wider uppercase font-serif">
          {isSo ? "Barta Macaamiisha" : "Customer Portal"}
        </p>
      </div>

      {customerNavGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="px-3 text-[10px] font-extrabold text-[#C89B3C]/80 uppercase tracking-widest mb-1.5 font-serif">
              {isSo ? group.titleSo || group.title : group.title}
            </p>
          )}
          {group.items.map(({ href, label, labelSo, icon: Icon }) => {
            const isActive =
              currentPath === href || (href === "/customer" && currentPath === "/customer");

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
