import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
  Shield, LogOut, Settings, Building2, Eye,
} from "lucide-react";
import AdminSidebarNav from "./AdminSidebarNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* ─── Sidebar (Deep Navy #0F172A) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed inset-y-0 left-0 z-30 shadow-lg">


        {/* User Info */}
        <div className="p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-[#34D399]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{session.user?.name || "Admin"}</p>
              <p className="text-xs text-[#34D399] font-medium">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <AdminSidebarNav />

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#1E293B] space-y-1">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#FCA5A5] hover:bg-[#EF4444]/15 hover:text-[#EF4444] transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#10B981]" />
            <span className="font-bold text-[#0F172A] text-sm">Admin Control Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-[#0F172A] hover:text-[#10B981] flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> View Public Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
