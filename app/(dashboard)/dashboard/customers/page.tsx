import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ManagerCustomersClient from "@/components/dashboard/ManagerCustomersClient";
import { getCustomersDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers – Manager Portal | Kiro-Maal Real Estate",
  description: "Client CRM directory, rental history, customer engagement, and account management.",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function ManagerCustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const customers = await getCustomersDashboardData();

  return (
    <div className="w-full min-w-0">
      <ManagerCustomersClient initialCustomers={customers} />
    </div>
  );
}
