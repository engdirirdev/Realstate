import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import { getRentalDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentals & Tenancies – Manager Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function ManagerRentalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { metrics, bookings, totalBookings, rentals, totalRentals } = await getRentalDashboardData(
    session.user.id,
    (session.user as any).role || "USER"
  );

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView
        isAdmin={false}
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
