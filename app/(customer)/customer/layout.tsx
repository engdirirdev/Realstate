import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import CustomerSidebarNav from "./CustomerSidebarNav";
import CustomerHeader from "@/components/customer/CustomerHeader";
import BrandLogo from "@/components/layout/BrandLogo";
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
    <div className="min-h-screen bg-[#F5F1EA] flex">
      {/* ─── Sidebar (Deep Rich Midnight Navy Gradient) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-[#051325] via-[#071D36] to-[#040E1B] border-r border-[#103058] fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Brand Logo */}
        <div className="h-18 px-6 border-b border-[#103058] flex items-center bg-[#040E1B]/95">
          <BrandLogo variant="dark" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          <CustomerSidebarNav />
        </div>

        {/* Bottom User & Sign Out */}
        <div className="p-4 border-t border-[#103058] space-y-2 bg-[#030B15]/95">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#1677FF]/25 border border-[#1677FF]/50 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-[#38BDF8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs truncate">
                {session.user?.name || "Customer"}
              </p>
              <p className="text-[10px] text-[#38BDF8] font-semibold truncate">
                {session.user?.email || "customer@realestate.so"}
              </p>
            </div>
          </div>

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F87171] hover:bg-[#EF4444]/20 hover:text-white transition-all w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F5F1EA]">
        <CustomerHeader
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
