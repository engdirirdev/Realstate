// ================================================================
// PAGE NAME  : Customer Portal — Notifications
// ROUTE      : /customer/notifications
// DESCRIPTION: Notifications list for customer
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, Sparkles, Calendar, CreditCard, MessageSquare, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications – Customer Portal | Kiro-Maal Real Estate" };

export default async function CustomerNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Activity Feed
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Bell className="h-7 w-7 text-[#C89B3C]" /> Client Notifications
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">{notifications.length} alerts and updates received for your account</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Bell className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No notifications yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
            You will receive instant updates here when property managers respond to your inquiries or confirm scheduled visits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-start gap-4 hover:border-[#C89B3C]/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] flex-shrink-0 mt-0.5 shadow-inner">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-[#07111F] text-sm">{n.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-[#A97918] font-bold mt-2">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
