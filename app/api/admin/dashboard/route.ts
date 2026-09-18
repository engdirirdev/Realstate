import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/admin/dashboard - admin analytics
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      soldProperties,
      totalRecommendations,
      totalPredictions,
      totalChatSessions,
      totalMessages,
      recentUsers,
      propertiesByCity,
      propertiesByType,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", isActive: true } }),
      prisma.property.count(),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.property.count({ where: { status: "APPROVED" } }),
      prisma.property.count({ where: { status: "SOLD" } }),
      prisma.recommendation.count(),
      prisma.pricePrediction.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, isActive: true },
      }),
      prisma.property.groupBy({
        by: ["city"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      prisma.property.groupBy({
        by: ["type"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Average price per city
    const avgPrices = await prisma.property.groupBy({
      by: ["city"],
      _avg: { price: true },
      where: { status: "APPROVED" },
      orderBy: { _avg: { price: "desc" } },
      take: 6,
    });

    // Users registered over last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersOverTime = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, role: "USER" },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group users by month
    const usersByMonth: Record<string, number> = {};
    for (const u of usersOverTime) {
      const key = u.createdAt.toISOString().substring(0, 7); // YYYY-MM
      usersByMonth[key] = (usersByMonth[key] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalProperties,
          pendingProperties,
          approvedProperties,
          soldProperties,
          totalRecommendations,
          totalPredictions,
          totalChatSessions,
          totalMessages,
        },
        recentUsers,
        propertiesByCity: propertiesByCity.map((p) => ({ city: p.city, count: p._count.id })),
        propertiesByType: propertiesByType.map((p) => ({ type: p.type, count: p._count.id })),
        avgPricesByCity: avgPrices.map((p) => ({ city: p.city, avgPrice: Math.round(p._avg.price || 0) })),
        usersByMonth,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error);
    return NextResponse.json({ success: false, error: "Failed to load admin dashboard." }, { status: 500 });
  }
}
