// ================================================================
// PAGE NAME  : Admin Dashboard — Contact Messages
// ROUTE      : /admin/messages
// DESCRIPTION: Inbox for all contact form submissions — shows
//              unread messages highlighted, sender info, subject,
//              message body, reply-via-email button
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MessageSquare, Mail, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Messages – Admin" };

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-[#10B981]" /> Contact Messages
        </h1>
        <p className="text-[#64748B] text-sm mt-1">
          {messages.length} messages · {unread} unread
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-16 text-center">
          <MessageSquare className="h-16 w-16 text-[#E2E8F0] mx-auto mb-4" />
          <p className="text-[#64748B]">No contact messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-2xl shadow-card transition-all ${
                !msg.isRead ? "border-l-4 border-l-[#10B981] bg-[#ECFDF5] border border-y-[#E2E8F0] border-r-[#E2E8F0] p-5" : "border border-[#E2E8F0] p-5"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0F172A]">{msg.name}</h3>
                    {!msg.isRead && (
                      <span className="px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] rounded-full text-xs font-medium">New</span>
                    )}
                  </div>
                  <p className="text-sm text-[#0F172A] font-medium mt-0.5">{msg.subject}</p>
                </div>
                <div className="text-xs text-[#94A3B8] flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(msg.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
              </div>

              <p className="text-[#64748B] text-sm leading-relaxed mb-4">{msg.message}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#10B981]" />
                  <a href={`mailto:${msg.email}`} className="hover:text-[#059669] transition-colors">
                    {msg.email}
                  </a>
                </span>

                <a
                  href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                  className="ml-auto bg-white border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
