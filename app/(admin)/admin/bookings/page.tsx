import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import { getRentalDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Bookings Oversight – Admin | Kiro-Maal Real Estate",
};

export const revalidate = 30;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const resolved = searchParams ? await searchParams : {};
  const initialTab =
    resolved?.tab === "rentals" || resolved?.view === "rentals"
      ? "rentals"
      : "bookings";

  const { metrics, bookings, totalBookings, rentals, totalRentals } = await getRentalDashboardData(
    session.user.id,
    (session.user as any).role
  );

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView
        isAdmin={true}
        initialTab={initialTab}
        initialMetrics={metrics}
        initialBookings={bookings}
        initialBookingTotal={totalBookings}
        initialRentals={rentals}
        initialRentalTotal={totalRentals}
      />
    </div>
  );
}
