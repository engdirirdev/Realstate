import { NextRequest, NextResponse } from "next/server";
import { reviewRequest, type ReviewAction, type RequestKind } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized } from "@/lib/api-utils";

type Props = { params: Promise<{ kind: string; id: string }> };

const ACTIONS: ReviewAction[] = ["approve", "reject", "review", "cancel"];

// PATCH /api/requests/[kind]/[id]  body: { action, notes? }
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();

    const { kind, id } = await params;
    if (kind !== "purchase" && kind !== "rental") {
      return NextResponse.json({ success: false, error: "Unknown request type." }, { status: 400 });
    }
    const { action, notes } = await request.json();
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    }
    const updated = await reviewRequest(kind as RequestKind, id, user, action, typeof notes === "string" ? notes.slice(0, 2000) : undefined);
    return NextResponse.json({ success: true, request: updated });
  } catch (e) {
    return jsonError(e, "Failed to update request.");
  }
}
