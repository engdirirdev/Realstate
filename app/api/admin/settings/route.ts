import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid settings payload" }, { status: 400 });
    }

    const entries = Object.entries(body);
    if (entries.length > 0) {
      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/settings]", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
