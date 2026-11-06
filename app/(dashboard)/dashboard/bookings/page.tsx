import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import { getRentalDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Bookings – Manager Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function ManagerBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; view?: string; direct?: string; customerId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolved = searchParams ? await searchParams : {};
  const initialTab =
    resolved?.tab === "rentals" || resolved?.view === "rentals"
      ? "rentals"
      : "bookings";

  const initialDirectOpen = resolved?.direct === "true";
  const initialCustomerId = resolved?.customerId;

  const { metrics, bookings, totalBookings, rentals, totalRentals } = await getRentalDashboardData(
    session.user.id,
    (session.user as any).role || "USER"
  );

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView
        isAdmin={false}
        initialTab={initialTab}
        initialDirectOpen={initialDirectOpen}
        initialCustomerId={initialCustomerId}
        initialMetrics={metrics}
        initialBookings={bookings}
        initialBookingTotal={totalBookings}
        initialRentals={rentals}
        initialRentalTotal={totalRentals}
      />
    </div>
  );
}
