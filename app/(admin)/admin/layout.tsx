import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Settings } from "lucide-react";
import AdminSidebarNav from "./AdminSidebarNav";
import AdminHeader from "@/components/admin/AdminHeader";
<<<<<<< HEAD
=======
import BrandLogo from "@/components/layout/BrandLogo";
import SidebarSignOutButton from "@/components/layout/SidebarSignOutButton";
>>>>>>> 772e50c8fa5f6db9761a497c04520b18a979dfb3
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  // Real unread inquiries count for bell notification
  const unreadCount = await prisma.contactMessage
    .count({
      where: { isRead: false },
    })
    .catch(() => 0);

  return (
    <div className="min-h-screen bg-[#F5EFEB] flex font-sans">
      {/* ─── Sidebar (Dark Navy #0B1523 Matching Reference) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0B1523] border-r border-[#1B2738] fixed inset-y-0 left-0 z-30 shadow-2xl">
        {/* Top Kiro-Maal Logo Brand Header */}
        <div className="py-6 px-4 flex flex-col items-center justify-center text-center border-b border-[#1B2738]">
          <Link href="/admin" className="flex flex-col items-center group">
            <div className="w-16 h-16 relative mb-1.5 transition-transform group-hover:scale-105">
              <Image
                src="/images/kiro_maal_logo.png"
                alt="Kiro-Maal Real Estate"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-extrabold text-lg text-[#E8B849] tracking-tight font-serif">
              Kiro-Maal
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.16em]">
              Real Estate
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
          <AdminSidebarNav />
        </div>

        {/* Bottom User & Sign Out (Matching Screenshot) */}
        <div className="p-4 border-t border-[#1B2738] space-y-2 bg-[#09111D]">
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#C99126] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                {session.user?.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs truncate">
                  {session.user?.name || "Cabdullahi Axmed"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {session.user?.email || "admin@realestate.so"}
                </p>
              </div>
            </div>

            <Link
              href="/admin/settings"
              className="text-[#D9A336] hover:text-white p-1 transition-colors shrink-0"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

<<<<<<< HEAD
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Link>
=======
          <SidebarSignOutButton />
>>>>>>> 772e50c8fa5f6db9761a497c04520b18a979dfb3
        </div>
      </aside>

      {/* ─── Main Content Area (Warm Cream #F5EFEB) ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F5EFEB]">
        <AdminHeader
          userName={session.user?.name}
          userEmail={session.user?.email}
          userImage={session.user?.image}
          unreadCount={unreadCount || 5}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 bg-[#F5EFEB]">
          {children}
        </main>
      </div>
    </div>
  );
}
