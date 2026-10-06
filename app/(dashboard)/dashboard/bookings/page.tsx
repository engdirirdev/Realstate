import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, FileText } from "lucide-react";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Bookings – Manager Portal | Kiro-Maal Real Estate",
};

export default async function ManagerBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolved = searchParams ? await searchParams : {};
  const initialTab =
    resolved?.tab === "rentals" || resolved?.view === "rentals"
      ? "rentals"
      : "bookings";

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView isAdmin={false} initialTab={initialTab} />
    </div>
  );
}
