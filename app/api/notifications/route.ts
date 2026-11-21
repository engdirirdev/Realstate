import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.notification.deleteMany({
        where: {
          id,
          userId: session.user.id,
        },
      });
    } else {
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/notifications]", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}

