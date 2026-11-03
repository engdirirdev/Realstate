import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getComprehensiveHealthReport } from "@/lib/monitoring";
import { env } from "@/lib/env";
import { unauthorized, forbidden } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * Production Monitoring Telemetry Endpoint.
 *
 * Security:
 * - Allowed in development mode for debugging
 * - In production, requires either:
 *   1) Admin session (role: ADMIN)
 *   2) Bearer token matching MONITORING_SECRET or x-monitoring-key header
 */
export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    const monitoringKeyHeader = request.headers.get("x-monitoring-key");
    const configuredSecret = env.MONITORING_SECRET;

    const hasBearerMatch =
      configuredSecret &&
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      authHeader.substring(7) === configuredSecret;

    const hasHeaderMatch = configuredSecret && monitoringKeyHeader === configuredSecret;

    if (!hasBearerMatch && !hasHeaderMatch) {
      // Fallback: Check admin session
      const session = await auth();
      if (!session?.user) {
        return unauthorized("Authentication required to access monitoring telemetry.");
      }
      if ((session.user as any).role !== "ADMIN") {
        return forbidden("Administrative privileges required to access monitoring telemetry.");
      }
    }
  }

  const report = await getComprehensiveHealthReport();
  return NextResponse.json(report, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
