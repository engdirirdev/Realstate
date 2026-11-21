import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardSidebarNav from "./DashboardSidebarNav";
import ManagerHeader from "@/components/manager/ManagerHeader";
import BrandLogo from "@/components/layout/BrandLogo";
import { prisma } from "@/lib/prisma";
import { dbCache } from "@/lib/cache";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role === "ADMIN") redirect("/admin");
  if ((session.user as any)?.role === "CUSTOMER") redirect("/customer");

  const userId = session.user?.id;

  // Unread notification count cached with 30s TTL to prevent DB hammering on every click
  const unreadCount = userId
    ? await dbCache.getOrSet(
        `user:unread_notifications:${userId}`,
        30,
        async () => {
          return prisma.notification.count({
            where: { userId, isRead: false },
          }).catch(() => 0);
        },
        ["notifications", userId]
      )
    : 0;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#F7F3EA] flex">
      {/* ─── Sidebar (Kiro-Maal Master Deep Navy) ─── */}
      <aside suppressHydrationWarning className="hidden lg:flex w-64 flex-col bg-[#07111F] border-r border-[#C89B3C]/20 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div suppressHydrationWarning className="h-18 px-6 border-b border-[#C89B3C]/20 flex items-center bg-[#07111F] shrink-0">
          <BrandLogo variant="dark" />
        </div>

        {/* Navigation (Scrollable if screen is scaled or low height) */}
        <div suppressHydrationWarning className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1B2738] hover:scrollbar-thumb-[#C89B3C]/50 py-4">
          <DashboardSidebarNav />
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 bg-[#F7F3EA]">
        <ManagerHeader
          userName={session.user?.name}
          userEmail={session.user?.email}
          userImage={session.user?.image}
          unreadCount={unreadCount}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 bg-[#F7F3EA]">
          {children}
        </main>
      </div>
    </div>
  );
}
