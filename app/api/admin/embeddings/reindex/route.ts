import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { indexAllApprovedProperties } from "@/lib/ai/indexing/index-service";

/**
 * POST /api/admin/embeddings/reindex
 * Administrative endpoint to trigger embedding generation for all approved properties.
 *
 * Security: Strict server-side ADMIN authorization required.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Administrative access required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceReindex = Boolean(body?.forceReindex);

    const summary = await indexAllApprovedProperties({ forceReindex });

    return NextResponse.json({
      success: true,
      message: `Indexing completed. ${summary.indexed} indexed, ${summary.updated} updated, ${summary.skipped} skipped.`,
      summary,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/embeddings/reindex] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger re-indexing" },
      { status: 500 }
    );
  }
}
