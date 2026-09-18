import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "properties";

    let csvContent = "";
    let filename = "";

    if (type === "properties") {
      const properties = await prisma.property.findMany({
        select: {
          id: true,
          title: true,
          city: true,
          type: true,
          price: true,
          status: true,
          bedrooms: true,
          bathrooms: true,
          area: true,
          viewCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["ID", "Title", "City", "Type", "Price", "Status", "Bedrooms", "Bathrooms", "Area_m2", "Views", "CreatedAt"];
      const rows = properties.map((p) => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.city,
        p.type,
        p.price,
        p.status,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.viewCount,
        p.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `properties_export_${Date.now()}.csv`;
    } else if (type === "users") {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["ID", "Name", "Email", "Phone", "Role", "IsActive", "CreatedAt"];
      const rows = users.map((u) => [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        u.phone || "",
        u.role,
        u.isActive,
        u.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `users_export_${Date.now()}.csv`;
    } else if (type === "payments") {
      const payments = await prisma.payment.findMany({
        select: {
          id: true,
          transactionRef: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          status: true,
          customerId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["ID", "TransactionRef", "Amount", "Currency", "Method", "Status", "CustomerID", "CreatedAt"];
      const rows = payments.map((p) => [
        p.id,
        p.transactionRef,
        p.amount,
        p.currency,
        p.paymentMethod,
        p.status,
        p.customerId,
        p.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `payments_export_${Date.now()}.csv`;
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Admin export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
