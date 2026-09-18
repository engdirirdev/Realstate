// ================================================================
// PAGE NAME  : Customer Portal — My Inquiries
// ROUTE      : /customer/inquiries
// DESCRIPTION: View customer property inquiries & manager responses
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Mail, Building2, MapPin, Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Inquiries – Customer Portal" };

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
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <MessageSquare className="h-6 w-6 text-[#10B981]" /> My Property Inquiries
        </h1>
        <p className="text-[#64748B] text-sm mt-1">{inquiries.length} inquiries sent to property managers</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <MessageSquare className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No inquiries sent yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            When you view a property, click "Send Property Enquiry" to ask the manager questions directly.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                    {inq.property.images[0] ? (
                      <img src={inq.property.images[0].url} alt={inq.property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/properties/${inq.property.id}`} className="font-bold text-[#0F172A] text-base hover:text-[#10B981] transition-colors">
                      {inq.property.title}
                    </Link>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#94A3B8]" /> {inq.property.city} • <span className="font-bold text-[#059669]">{formatPrice(inq.property.price)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    inq.status === "RESPONDED"
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                      : inq.status === "NEW"
                      ? "bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]"
                      : "bg-[#F1F5F9] text-[#334155]"
                  }`}>
                    {inq.status === "RESPONDED" ? "Replied by Manager" : inq.status === "NEW" ? "Pending Reply" : inq.status}
                  </span>
                </div>
              </div>

              {/* Inquiry details */}
              <div className="space-y-3">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs font-semibold text-[#0F172A] mb-1">Your Inquiry ({new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}):</p>
                  <p className="text-sm text-[#334155] leading-relaxed">{inq.message}</p>
                </div>

                {inq.response ? (
                  <div className="bg-[#ECFDF5] p-4 rounded-xl border border-[#A7F3D0]">
                    <p className="text-xs font-bold text-[#065F46] mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> Manager Response ({inq.manager?.name || "Property Manager"}):
                    </p>
                    <p className="text-sm text-[#047857] leading-relaxed">{inq.response}</p>
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] italic flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Waiting for property manager to respond...
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
