import { NextResponse } from "next/server";
import { checkDatabaseHealth, getComprehensiveHealthReport } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for container orchestrators (Kubernetes, AWS ECS, Docker Compose)
 * and uptime monitoring services (UptimeRobot, Datadog Synthetics).
 *
 * Supported modes:
 * - HEAD /api/health: Ultra-fast empty 200 for ALB / load balancer pings
 * - GET /api/health: Liveness probe (checks server process responsiveness)
 * - GET /api/health?check=ready: Readiness probe (verifies database connectivity)
 * - GET /api/health?check=full: Full telemetry and diagnostic report
 */

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkMode = url.searchParams.get("check");

  // 1. Full Diagnostic Report
  if (checkMode === "full") {
    const report = await getComprehensiveHealthReport();
    const httpStatus = report.status === "unhealthy" ? 503 : 200;
    return NextResponse.json(report, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  // 2. Readiness Probe (Database check)
  if (checkMode === "ready") {
    const db = await checkDatabaseHealth();
    if (db.status === "DOWN") {
      return NextResponse.json(
        {
          status: "unready",
          ready: false,
          error: "Database connectivity check failed.",
          database: db,
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    return NextResponse.json(
      {
        status: "ready",
        ready: true,
        database: db,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 3. Default Liveness Probe (Process is alive and responding)
  return NextResponse.json(
    {
      status: "ok",
      alive: true,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
