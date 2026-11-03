/**
 * Production Monitoring & System Health Diagnostics Engine.
 *
 * Provides telemetry for:
 * - Process memory consumption & threshold monitoring
 * - Database connectivity & round-trip query latency
 * - Node.js runtime & CPU utilization
 * - Cache hit rate & storage telemetry
 * - Overall system status (HEALTHY, DEGRADED, UNHEALTHY)
 */

import { prisma } from "@/lib/prisma";
import { dbCache } from "@/lib/cache";
import { auditProductionConfig } from "@/lib/env";

export interface MemoryMetrics {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  heapUsagePercent: number;
  isConstrained: boolean;
}

export interface DatabaseHealth {
  status: "UP" | "DOWN";
  latencyMs: number;
  error?: string;
}

export interface SystemMetrics {
  uptimeSeconds: number;
  uptimeFormatted: string;
  memory: MemoryMetrics;
  cpu: {
    userMicros: number;
    systemMicros: number;
  };
  node: {
    version: string;
    platform: string;
    arch: string;
    pid: number;
  };
  cache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
}

export interface ComprehensiveHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  environment: string;
  database: DatabaseHealth;
  system: SystemMetrics;
  config: {
    isValid: boolean;
    warningCount: number;
    errorCount: number;
  };
}

/**
 * Format uptime seconds into human-readable duration (e.g. "3d 4h 12m 30s").
 */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * Gather Node.js process metrics, memory allocations, and cache performance.
 */
export function getSystemMetrics(): SystemMetrics {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
  const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100;
  const rssMb = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
  const externalMb = Math.round((mem.external / 1024 / 1024) * 100) / 100;
  const heapUsagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 1000) / 10;
  const cpu = process.cpuUsage();
  const uptimeSeconds = Math.round(process.uptime());

  return {
    uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    memory: {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb,
      heapUsagePercent,
      isConstrained: heapUsagePercent > 85,
    },
    cpu: {
      userMicros: cpu.user,
      systemMicros: cpu.system,
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    cache: dbCache.getStats(),
  };
}

/**
 * Perform active health check on database connection and measure latency.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const start = Date.now();
  try {
    // Lightweight SELECT 1 query
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      status: "UP",
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      status: "DOWN",
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Generate full diagnostic report for APM, Kubernetes readiness probes, or admin monitoring.
 */
export async function getComprehensiveHealthReport(): Promise<ComprehensiveHealthReport> {
  const [dbHealth, configAudit] = await Promise.all([
    checkDatabaseHealth(),
    auditProductionConfig(),
  ]);

  const system = getSystemMetrics();

  // Evaluate overall status
  let status: ComprehensiveHealthReport["status"] = "healthy";
  if (dbHealth.status === "DOWN" || !configAudit.isValid) {
    status = "unhealthy";
  } else if (dbHealth.latencyMs > 1000 || system.memory.isConstrained || configAudit.warnings.length > 0) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: dbHealth,
    system,
    config: {
      isValid: configAudit.isValid,
      warningCount: configAudit.warnings.length,
      errorCount: configAudit.errors.length,
    },
  };
}
