import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import AdminSidebarNav from "./AdminSidebarNav";
import AdminHeader from "@/components/admin/AdminHeader";
import BrandLogo from "@/components/layout/BrandLogo";
import SidebarSignOutButton from "@/components/layout/SidebarSignOutButton";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  // Real unread inquiries count for bell notification
  const unreadCount = await prisma.contactMessage.count({
    where: { isRead: false },
  }).catch(() => 0);

  return (
    <div className="min-h-screen bg-[#F5F1EA] flex">
      {/* ─── Sidebar (Deep Rich Midnight Navy Gradient) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-[#051325] via-[#071D36] to-[#040E1B] border-r border-[#103058] fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div className="h-18 px-6 border-b border-[#103058] flex items-center bg-[#040E1B]/95">
          <BrandLogo variant="dark" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          <AdminSidebarNav />
        </div>

        {/* Bottom User & Sign Out */}
        <div className="p-4 border-t border-[#103058] space-y-2 bg-[#030B15]/95">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#1677FF]/25 border border-[#1677FF]/50 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-[#38BDF8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs truncate">
                {session.user?.name || "Administrator"}
              </p>
              <p className="text-[10px] text-[#38BDF8] font-semibold truncate">
                {session.user?.email || "admin@realestate.so"}
              </p>
            </div>
          </div>

          <SidebarSignOutButton />
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F5F1EA]">
        <AdminHeader
          userName={session.user?.name}
          userEmail={session.user?.email}
          userImage={session.user?.image}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 bg-[#F5F1EA]">
          {children}
        </main>
      </div>
    </div>
  );
}
