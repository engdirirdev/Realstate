// ================================================================
// PAGE NAME  : Customer Portal — Messages & Manager Consultations
// ROUTE      : /customer/messages
// DESCRIPTION: Unified two-way communication channel with property managers
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerMessagesClient from "@/components/customer/CustomerMessagesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages – Customer Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

export default async function CustomerMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawInquiries, rawProperties, rawManagers] = await Promise.all([
    prisma.inquiry.findMany({
      where: { customerId: session.user.id },
      take: 50,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            listingType: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        manager: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.property.findMany({
      where: {
        status: { in: ["APPROVED", "PUBLISHED"] },
        isActive: true,
      },
      take: 50,
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        managerId: true,
        manager: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const inquiries = rawInquiries.map((inq) => ({
    ...inq,
    createdAt: inq.createdAt.toISOString(),
    updatedAt: inq.updatedAt.toISOString(),
  }));

  const properties = rawProperties.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    price: Number(p.price),
    managerId: p.managerId,
    managerName: p.manager?.name || "Property Manager",
  }));

  const managers = rawManagers.map((m) => ({
    id: m.id,
    name: m.name || "Property Manager",
    email: m.email,
  }));

  return (
    <CustomerMessagesClient
      initialInquiries={inquiries}
      properties={properties}
      managers={managers}
    />
  );
}
