import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import CustomerSidebarNav from "./CustomerSidebarNav";
import CustomerHeader from "@/components/customer/CustomerHeader";
import BrandLogo from "@/components/layout/BrandLogo";
import SidebarSignOutButton from "@/components/layout/SidebarSignOutButton";
import { prisma } from "@/lib/prisma";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user?.id;

  // Real unread notifications count
  const unreadCount = userId
    ? await prisma.notification.count({
        where: { userId, isRead: false },
      }).catch(() => 0)
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex">
      {/* ─── Sidebar (Kiro-Maal Master Deep Navy) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#07111F] border-r border-[#C89B3C]/20 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div className="h-18 px-6 border-b border-[#C89B3C]/20 flex items-center bg-[#07111F]">
          <BrandLogo variant="dark" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          <CustomerSidebarNav />
        </div>

        {/* Bottom User & Sign Out */}
        <div className="p-4 border-t border-[#C89B3C]/20 space-y-2 bg-[#050C16]">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-[#D9B45B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#FCFBF7] text-xs truncate">
                {session.user?.name || "Customer"}
              </p>
              <p className="text-[10px] text-[#D9B45B] font-semibold truncate">
                {session.user?.email || "customer@realestate.so"}
              </p>
            </div>
          </div>

          <SidebarSignOutButton />
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F7F3EA] min-w-0">
        <CustomerHeader
          userName={session.user?.name}
          userEmail={session.user?.email}
          userImage={session.user?.image}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 bg-[#F7F3EA]">
          {children}
        </main>
      </div>
    </div>
  );
}
