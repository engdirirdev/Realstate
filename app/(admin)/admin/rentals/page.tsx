import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, KeyRound } from "lucide-react";
import CentralBookingsRentalsView from "@/components/bookings/CentralBookingsRentalsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentals & Tenancies Oversight – Admin | Kiro-Maal Real Estate",
};

export default async function AdminRentalsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  return (
    <div className="w-full min-w-0">
      <CentralBookingsRentalsView isAdmin={true} initialTab="rentals" />
    </div>
  );
}
