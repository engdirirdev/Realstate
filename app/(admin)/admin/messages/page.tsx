// ================================================================
// PAGE NAME  : Admin Dashboard — Contact Messages
// ROUTE      : /admin/messages
// DESCRIPTION: Inbox for all contact form submissions — shows
//              unread messages highlighted, sender info, subject,
//              message body, reply-via-email button
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MessageSquare, Mail, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Messages – Admin | Kiro-Maal Real Estate" };

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Client Communications
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
          <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> Inbound Inquiries &amp; Messages
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {messages.length} total messages · {unread} unread client inquiries
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-16 text-center max-w-lg mx-auto">
          <MessageSquare className="h-14 w-14 text-[#C89B3C]/40 mx-auto mb-4" />
          <p className="text-[#6B7280] text-sm">No client contact messages recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-[#FCFBF7] rounded-2xl shadow-sm transition-all ${
                !msg.isRead
                  ? "border-l-4 border-l-[#C89B3C] border-y border-r border-[#E8E1D4] p-5 shadow-xs"
                  : "border border-[#E8E1D4] p-5"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-[#07111F] text-base">{msg.name}</h3>
                    {!msg.isRead && (
                      <span className="px-2.5 py-0.5 bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        New Inquiry
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A97918] font-bold mt-1 uppercase tracking-wide">{msg.subject}</p>
                </div>
                <div className="text-xs text-[#6B7280] flex items-center gap-1.5 flex-shrink-0 font-medium">
                  <Clock className="h-3.5 w-3.5 text-[#C89B3C]" />
                  {new Date(msg.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
              </div>

              <p className="text-[#4B5563] text-sm leading-relaxed mb-4">{msg.message}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pt-3 border-t border-[#E8E1D4]">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />
                  <a href={`mailto:${msg.email}`} className="hover:text-[#07111F] transition-colors font-medium">
                    {msg.email}
                  </a>
                </span>

                <a
                  href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                  className="ml-auto bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
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
