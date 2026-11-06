import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Settings } from "lucide-react";
import AdminSidebarNav from "./AdminSidebarNav";
import AdminHeader from "@/components/admin/AdminHeader";
import SidebarSignOutButton from "@/components/layout/SidebarSignOutButton";
import BrandLogo from "@/components/layout/BrandLogo";
import { prisma } from "@/lib/prisma";
import { dbCache } from "@/lib/cache";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  // Real unread inquiries count for bell notification cached with 30s TTL to prevent DB hammering on every click
  const unreadCount = await dbCache.getOrSet(
    "admin:unread_messages_count",
    30,
    async () => {
      return prisma.contactMessage
        .count({
          where: { isRead: false },
        })
        .catch(() => 0);
    },
    ["admin", "messages"]
  );

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#F5EFEB] flex font-sans">
      {/* ─── Sidebar (Dark Navy #0B1523 Matching Reference) ─── */}
      <aside suppressHydrationWarning className="hidden lg:flex w-64 flex-col bg-[#0B1523] border-r border-[#1B2738] fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Top Kiro-Maal Logo Brand Header */}
        <div suppressHydrationWarning className="h-[72px] min-h-[72px] px-5 border-b border-[#1B2738] flex items-center bg-[#0B1523] shrink-0">
          <BrandLogo variant="dark" href="/admin" size="md" />
        </div>

        {/* Navigation Items (Scrollable if screen is scaled or low height) */}
        <div suppressHydrationWarning className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1B2738] hover:scrollbar-thumb-[#C89B3C]/50 py-3">
          <AdminSidebarNav />
        </div>

        {/* Bottom User & Sign Out (Matching Screenshot) */}
        <div suppressHydrationWarning className="p-4 border-t border-[#1B2738] space-y-2 bg-[#09111D] shrink-0">
          <div suppressHydrationWarning className="flex items-center justify-between gap-3 px-1 py-1">
            <div suppressHydrationWarning className="flex items-center gap-2.5 min-w-0">
              <div suppressHydrationWarning className="w-9 h-9 rounded-full bg-[#C99126] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                <span suppressHydrationWarning>{session.user?.name?.charAt(0).toUpperCase() || "C"}</span>
              </div>
              <div suppressHydrationWarning className="min-w-0">
                <p suppressHydrationWarning className="font-bold text-white text-xs truncate">
                  {session.user?.name || "Cabdullahi Axmed"}
                </p>
                <p suppressHydrationWarning className="text-[10px] text-slate-400 font-medium truncate">
                  {session.user?.email || "admin@realestate.so"}
                </p>
              </div>
            </div>

            <Link
              suppressHydrationWarning
              href="/admin/settings"
              prefetch={true}
              className="text-[#D9A336] hover:text-white p-1 transition-colors shrink-0"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          <SidebarSignOutButton />
        </div>
      </aside>

      {/* ─── Main Content Area (Warm Cream #F5EFEB) ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 bg-[#F5EFEB]">
        <AdminHeader
          userName={session.user?.name}
          userEmail={session.user?.email}
          userImage={session.user?.image}
          unreadCount={unreadCount || 5}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 bg-[#F5EFEB]">
          {children}
        </main>
      </div>
    </div>
  );
}
