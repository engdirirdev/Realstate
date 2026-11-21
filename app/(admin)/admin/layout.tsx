import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebarNav from "./AdminSidebarNav";
import AdminHeader from "@/components/admin/AdminHeader";
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

  const userId = session.user?.id;

  // Fetch fresh admin profile and unread inquiries count in parallel
  const [dbUser, unreadCount] = await Promise.all([
    userId
      ? prisma.user
          .findUnique({
            where: { id: userId },
            select: { name: true, email: true, image: true },
          })
          .catch(() => null)
      : Promise.resolve(null),
    dbCache.getOrSet(
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
    ),
  ]);

  const activeName = dbUser?.name || session.user?.name || "Cabdullahi Axmed";
  const activeEmail = dbUser?.email || session.user?.email || "admin@realestate.so";
  const activeImage = dbUser?.image || session.user?.image || null;

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
      </aside>

      {/* ─── Main Content Area (Warm Cream #F5EFEB) ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 bg-[#F5EFEB]">
        <AdminHeader
          userName={activeName}
          userEmail={activeEmail}
          userImage={activeImage}
          unreadCount={unreadCount || 5}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 bg-[#F5EFEB]">
          {children}
        </main>
      </div>
    </div>
  );
}
