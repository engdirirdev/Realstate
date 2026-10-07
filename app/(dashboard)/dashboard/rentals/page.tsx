import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, KeyRound } from "lucide-react";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentals & Tenancies – Manager Portal | Kiro-Maal Real Estate",
};

export default async function ManagerRentalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView isAdmin={false} initialTab="rentals" />
    </div>
  );
}
