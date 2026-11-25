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
    <div suppressHydrationWarning className="min-h-screen bg-[#F5F1E8] flex font-sans">
      {/* ─── Sidebar (Deep Navy #0B1728) ─── */}
      <aside suppressHydrationWarning className="hidden lg:flex w-64 flex-col bg-[#0B1728] border-r border-white/10 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Top Kiro-Maal Logo Brand Header */}
        <div suppressHydrationWarning className="h-[72px] min-h-[72px] px-5 border-b border-white/10 flex items-center bg-[#0B1728] shrink-0">
          <BrandLogo variant="dark" href="/admin" size="md" />
        </div>

        {/* Navigation Items */}
        <div suppressHydrationWarning className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-[#D6A536]/50 py-3">
          <AdminSidebarNav />
        </div>
      </aside>

      {/* ─── Main Content Area (Warm Cream #F5F1E8) ─── */}
      <div suppressHydrationWarning className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 bg-[#F5F1E8]">
        <AdminHeader
          userName={activeName}
          userEmail={activeEmail}
          userImage={activeImage}
          unreadCount={unreadCount || 0}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 bg-[#F5F1E8]">
          {children}
        </main>
      </div>
    </div>
  );
}
