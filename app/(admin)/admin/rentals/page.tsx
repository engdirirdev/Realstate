import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import { getRentalDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentals & Tenancies Oversight – Admin | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function AdminRentalsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const { metrics, bookings, totalBookings, rentals, totalRentals } = await getRentalDashboardData(
    session.user.id,
    (session.user as any).role
  );

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView
        isAdmin={true}
        initialTab="rentals"
        initialMetrics={metrics}
        initialBookings={bookings}
        initialBookingTotal={totalBookings}
        initialRentals={rentals}
        initialRentalTotal={totalRentals}
      />
    </div>
  );
}
