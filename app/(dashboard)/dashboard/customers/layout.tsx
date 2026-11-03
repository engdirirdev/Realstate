import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Directory – Manager Dashboard | Kiro-Maal Real Estate",
  description: "Manage client portfolio, bookings, inquiries, and customer transactions.",
};

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
