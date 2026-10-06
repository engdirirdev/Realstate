import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, FileText } from "lucide-react";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Bookings Oversight – Admin | Kiro-Maal Real Estate",
};

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

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView isAdmin={true} initialTab={initialTab} />
    </div>
  );
}
