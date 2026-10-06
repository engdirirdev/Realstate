import { redirect } from "next/navigation";

export default async function ManagerRequestsPage() {
  redirect("/dashboard/bookings?tab=rentals");
}
