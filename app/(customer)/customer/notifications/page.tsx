// ================================================================
// PAGE NAME  : Customer Portal — Notifications
// ROUTE      : /customer/notifications
// DESCRIPTION: Notifications list for customer
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, Sparkles, Calendar, CreditCard, MessageSquare, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications – Customer Portal" };

export default async function CustomerNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Bell className="h-6 w-6 text-[#10B981]" /> Notifications
        </h1>
        <p className="text-[#64748B] text-sm mt-1">{notifications.length} notifications received</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Bell className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No notifications yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
            You will receive notifications here when managers reply to your inquiries or confirm bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981] flex-shrink-0 mt-0.5">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#0F172A] text-sm">{n.title}</h3>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-[#94A3B8] mt-2">
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
