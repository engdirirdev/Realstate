import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
  LayoutDashboard, Heart, Bot, BarChart3, Settings,
  LogOut, User, Building2, Bell, Sparkles, ChevronRight,
} from "lucide-react";
import DashboardSidebarNav from "./DashboardSidebarNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role === "ADMIN") redirect("/admin");
  if ((session.user as any)?.role === "CUSTOMER") redirect("/customer");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* ─── Sidebar (Deep Navy #0F172A) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed inset-y-0 left-0 z-30 shadow-lg">


        {/* User info */}
        <div className="p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-[#34D399]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{session.user?.name || "User"}</p>
              <p className="text-xs text-[#94A3B8] truncate">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Client Navigation Items with Active Route Highlighting */}
        <DashboardSidebarNav />

        {/* Bottom actions */}
        <div className="p-4 border-t border-[#1E293B] space-y-1">
          <Link
            href="/properties"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-all"
          >
            <Building2 className="h-4 w-4 text-[#34D399]" /> Browse Properties
          </Link>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#FCA5A5] hover:bg-[#EF4444]/15 hover:text-[#EF4444] transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top header bar */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-3.5 flex items-center justify-between lg:px-8 sticky top-0 z-20 shadow-xs">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#10B981] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[#0F172A] text-sm">AI RealEstate</span>
            </Link>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              Welcome back, <span className="text-[#10B981] font-bold">{session.user?.name?.split(" ")[0]}</span> 👋
            </h2>
          </div>

          {/* Top Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition-colors relative"
            >
              <Bell className="h-4 w-4 text-[#0F172A]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#10B981] rounded-full ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center">
                <User className="h-4.5 w-4.5 text-[#059669]" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
