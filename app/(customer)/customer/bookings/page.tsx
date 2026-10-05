// ================================================================
// PAGE NAME  : Customer Portal — My Bookings
// ROUTE      : /customer/bookings
// DESCRIPTION: View customer property reservations and pay pending
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Building2, MapPin, CreditCard, CheckCircle2, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Bookings – Customer Portal | Kiro-Maal Real Estate" };

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
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Reservations &amp; Acquisition
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Calendar className="h-7 w-7 text-[#C89B3C]" /> My Property Reservations
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">{bookings.length} reservations created and tracked in escrow</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Calendar className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No bookings or reservations yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            Find your ideal luxury property and select &ldquo;Book Visit / Reserve&rdquo; to initiate your transaction portfolio.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <Building2 className="h-4 w-4" /> Explore Exclusive Estates
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-[#FCFBF7] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D4] pb-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#07111F] overflow-hidden shrink-0 border border-[#E8E1D4] relative">
                    {b.property.images[0] ? (
                      <img
                        src={b.property.images[0].url}
                        alt={b.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/customer/properties/${b.property.id}`}
                      className="font-serif font-bold text-[#07111F] text-base sm:text-lg hover:text-[#A97918] transition-colors truncate block"
                    >
                      {b.property.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-[#6B7280] flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C] shrink-0" /> {b.property.city}
                      </span>
                      <span>•</span>
                      <span className="font-serif font-bold text-[#07111F] text-sm sm:text-base">
                        {formatPrice(b.totalPrice)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === "CONFIRMED"
                        ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 shadow-xs"
                        : b.status === "PENDING"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
                <div>
                  <p>
                    Booked on:{" "}
                    <span className="font-semibold text-[#07111F]">
                      {new Date(b.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  {b.notes && <p className="mt-1 text-[#4B5563]">Notes: &ldquo;{b.notes}&rdquo;</p>}
                </div>

                {b.payments.length > 0 ? (
                  <div className="inline-flex items-center gap-1.5 font-bold text-[#07111F] bg-[#F7F3EA] px-3.5 py-1.5 rounded-xl border border-[#E8E1D4] shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-[#C89B3C]" /> Settlement Completed ({b.payments[0].transactionRef})
                  </div>
                ) : (
                  <Link
                    href="/customer/payments"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Settle {formatPrice(b.totalPrice)} Now
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
