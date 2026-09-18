// ================================================================
// PAGE NAME  : Customer Portal — My Bookings
// ROUTE      : /customer/bookings
// DESCRIPTION: View customer property reservations and pay pending
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Building2, MapPin, CreditCard, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Bookings – Customer Portal" };

export default async function CustomerBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    include: {
      property: {
        select: { id: true, title: true, city: true, price: true, type: true, images: { take: 1, orderBy: { order: "asc" } } },
      },
      payments: { select: { id: true, amount: true, status: true, transactionRef: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Calendar className="h-6 w-6 text-[#10B981]" /> My Property Reservations
        </h1>
        <p className="text-[#64748B] text-sm mt-1">{bookings.length} reservations created</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Calendar className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No bookings or reservations yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            Find your dream home and click "Book / Reserve Property" to reserve it.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Building2 className="h-4 w-4" /> Explore Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                    {b.property.images[0] ? (
                      <img src={b.property.images[0].url} alt={b.property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/properties/${b.property.id}`} className="font-bold text-[#0F172A] text-base hover:text-[#10B981] transition-colors">
                      {b.property.title}
                    </Link>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#94A3B8]" /> {b.property.city} • <span className="font-bold text-[#059669]">{formatPrice(b.totalPrice)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    b.status === "CONFIRMED"
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                      : b.status === "PENDING"
                      ? "bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]"
                      : "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
                <div>
                  <p>Booked on: <span className="font-semibold text-[#0F172A]">{new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></p>
                  {b.notes && <p className="mt-1 text-[#334155]">Notes: "{b.notes}"</p>}
                </div>

                {b.payments.length > 0 ? (
                  <div className="flex items-center gap-1.5 font-bold text-[#059669]">
                    <CheckCircle2 className="h-4 w-4" /> Paid ({b.payments[0].transactionRef})
                  </div>
                ) : (
                  <Link
                    href="/customer/payments"
                    className="inline-flex items-center gap-1.5 bg-[#10B981] text-white hover:bg-[#059669] px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Pay {formatPrice(b.totalPrice)} Now
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
