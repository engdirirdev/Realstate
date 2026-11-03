import { redirect } from "next/navigation";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; kind?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  if (sp?.tab === "rentals" || sp?.tab === "rental" || sp?.kind === "rental") {
    redirect("/admin/bookings?tab=rentals");
  }
  redirect("/admin/sales");
}
