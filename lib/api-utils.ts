import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TxnError, type Actor } from "@/lib/transactions";

export async function requireUser(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: (session.user as any).role, name: session.user.name };
}

export function jsonError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof TxnError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error("[api]", error);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}

export const unauthorized = () =>
  NextResponse.json({ success: false, error: "Please sign in to continue." }, { status: 401 });

export const forbidden = (msg = "You do not have permission to do this.") =>
  NextResponse.json({ success: false, error: msg }, { status: 403 });

export function parsePaging(searchParams: URLSearchParams, defaultSize = 20) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
