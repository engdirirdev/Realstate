import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";
import { getSettingsDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Settings – Admin Portal | Kiro-Maal Real Estate",
  description: "Platform architecture, executive team, payment settlements, security governance, and AI configuration.",
};

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const { settings, paymentMethods, executiveTeam } = await getSettingsDashboardData();

  return (
    <div className="w-full min-w-0">
      <AdminSettingsClient
        initialSettings={settings}
        initialPaymentMethods={paymentMethods}
        initialExecutiveTeam={executiveTeam}
      />
    </div>
  );
}
