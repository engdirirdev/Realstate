import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getIndexDiagnostics } from "@/lib/ai/indexing/index-service";

/**
 * GET /api/admin/embeddings/status
 * Administrative endpoint to check semantic search index coverage & status.
 *
 * Security: Strict server-side ADMIN authorization required.
 */
export async function GET(_request: NextRequest) {
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

    const diagnostics = await getIndexDiagnostics();
    return NextResponse.json({
      success: true,
      diagnostics,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/embeddings/status] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch embedding diagnostics" },
      { status: 500 }
    );
  }
}
