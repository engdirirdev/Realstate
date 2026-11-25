import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CustomerSidebarNav from "./CustomerSidebarNav";
import CustomerHeader from "@/components/customer/CustomerHeader";
import BrandLogo from "@/components/layout/BrandLogo";
import { prisma } from "@/lib/prisma";
import { dbCache } from "@/lib/cache";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user?.id;

  const [dbUser, unreadCount] = await Promise.all([
    userId
      ? prisma.user
          .findUnique({
            where: { id: userId },
            select: { name: true, email: true, image: true },
          })
          .catch(() => null)
      : Promise.resolve(null),
    userId
      ? dbCache.getOrSet(
          `customer:unread_notifications:${userId}`,
          30,
          async () => {
            return prisma.notification
              .count({
                where: { userId, isRead: false },
              })
              .catch(() => 0);
          },
          ["notifications", userId]
        )
      : Promise.resolve(0),
  ]);

  const activeName = dbUser?.name || session.user?.name || "Customer";
  const activeEmail = dbUser?.email || session.user?.email || "customer@realestate.so";
  const activeImage = dbUser?.image || session.user?.image || null;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#F5F1E8] flex font-sans">
      {/* ─── Sidebar (Deep Navy #0B1728) ─── */}
      <aside suppressHydrationWarning className="hidden lg:flex w-64 flex-col bg-[#0B1728] border-r border-white/10 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div suppressHydrationWarning className="h-[72px] min-h-[72px] px-5 border-b border-white/10 flex items-center bg-[#0B1728] shrink-0">
          <BrandLogo variant="dark" href="/customer" size="md" />
        </div>

        {/* Navigation */}
        <div suppressHydrationWarning className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-[#D6A536]/50 py-3">
          <CustomerSidebarNav />
        </div>
      </aside>

      {/* ─── Main Content Area (Warm Cream #F5F1E8) ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F5F1E8] min-w-0">
        <CustomerHeader
          userName={activeName}
          userEmail={activeEmail}
          userImage={activeImage}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 bg-[#F5F1E8] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
