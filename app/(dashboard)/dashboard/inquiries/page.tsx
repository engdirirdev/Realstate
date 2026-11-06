import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ManagerInquiriesClient from "@/components/dashboard/ManagerInquiriesClient";
import { getInquiriesDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inquiries – Manager Portal | Kiro-Maal Real Estate",
  description: "Customer property inquiries, advisory responses, and direct consultations.",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function ManagerInquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const inquiries = await getInquiriesDashboardData(
    session.user.id,
    (session.user as any).role || "USER"
  );

  return (
    <div className="w-full min-w-0">
      <ManagerInquiriesClient initialInquiries={inquiries} />
    </div>
  );
}
