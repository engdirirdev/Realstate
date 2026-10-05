// ================================================================
// PAGE NAME  : Customer Portal — My Inquiries
// ROUTE      : /customer/inquiries
// DESCRIPTION: View customer property inquiries & manager responses
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Mail, Building2, MapPin, Calendar, Clock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Inquiries – Customer Portal | Kiro-Maal Real Estate" };

export default async function CustomerInquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const inquiries = await prisma.inquiry.findMany({
    where: { customerId: session.user.id },
    include: {
      property: {
        select: { id: true, title: true, city: true, price: true, images: { take: 1, orderBy: { order: "asc" } } },
      },
      manager: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Direct Consultations
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <MessageSquare className="h-7 w-7 text-[#C89B3C]" /> My Property Inquiries
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">{inquiries.length} property consultations dispatched to advisors</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <MessageSquare className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No inquiries sent yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            When you view any verified listing, select &ldquo;Send Property Enquiry&rdquo; to connect directly with the assigned property advisor.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#07111F] overflow-hidden flex-shrink-0 border border-[#E8E1D4]">
                    {inq.property.images[0] ? (
                      <img src={inq.property.images[0].url} alt={inq.property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/customer/properties/${inq.property.id}`} className="font-serif font-bold text-[#07111F] text-base hover:text-[#A97918] transition-colors">
                      {inq.property.title}
                    </Link>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {inq.property.city} • <span className="font-serif font-bold text-[#07111F]">{formatPrice(inq.property.price)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    inq.status === "RESPONDED"
                      ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                      : inq.status === "NEW"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-[#F7F3EA] text-[#6B7280] border border-[#E8E1D4]"
                  }`}>
                    {inq.status === "RESPONDED" ? "Replied by Advisor" : inq.status === "NEW" ? "Pending Reply" : inq.status}
                  </span>
                </div>
              </div>

              {/* Inquiry details */}
              <div className="space-y-3">
                <div className="bg-[#F7F3EA] p-4 rounded-xl border border-[#E8E1D4]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Your Inquiry ({new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}):</p>
                  <p className="text-sm text-[#07111F] leading-relaxed">{inq.message}</p>
                </div>

                {inq.response ? (
                  <div className="bg-[#07111F] p-4 rounded-xl border border-[#C89B3C]/30 text-white">
                    <p className="text-xs font-bold text-[#D9B45B] mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-[#D9B45B]" /> Advisor Response ({inq.manager?.name || "Kiro-Maal Concierge"}):
                    </p>
                    <p className="text-sm text-[#E8E1D4] leading-relaxed">{inq.response}</p>
                  </div>
                ) : (
                  <p className="text-xs text-[#A97918] italic flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-[#C89B3C]" /> Dedicated property advisor reviewing your inquiry...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
