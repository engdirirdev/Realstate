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
    <div suppressHydrationWarning className="min-h-screen bg-[#F7F3EA] flex">
      {/* ─── Sidebar (Kiro-Maal Master Deep Navy) ─── */}
      <aside suppressHydrationWarning className="hidden lg:flex w-64 flex-col bg-[#07111F] border-r border-[#C89B3C]/20 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div suppressHydrationWarning className="h-18 px-6 border-b border-[#C89B3C]/20 flex items-center bg-[#07111F] shrink-0">
          <BrandLogo variant="dark" />
        </div>

        {/* Navigation (Scrollable if screen is scaled or low height) */}
        <div suppressHydrationWarning className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1B2738] hover:scrollbar-thumb-[#C89B3C]/50 py-4">
          <CustomerSidebarNav />
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F7F3EA] min-w-0">
        <CustomerHeader
          userName={activeName}
          userEmail={activeEmail}
          userImage={activeImage}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 bg-[#F7F3EA] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
