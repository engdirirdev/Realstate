import { redirect } from "next/navigation";

// Consolidated into the unified Transactions Ledger & Payments page (/admin/transactions)
export default function AdminPaymentsPage() {
  redirect("/admin/transactions?tab=payments");
}
