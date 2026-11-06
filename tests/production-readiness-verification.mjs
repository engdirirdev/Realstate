/**
 * Comprehensive Automated Verification Suite for Production Readiness & Deployment
 * Platform: Kiro-Maal Luxury Real Estate
 */

import assert from "node:assert/strict";
import { auditProductionConfig, env } from "../lib/env.ts";
import {
  getSystemMetrics,
  formatUptime,
  checkDatabaseHealth,
  getComprehensiveHealthReport,
} from "../lib/monitoring.ts";
import { Logger, sanitizeData } from "../lib/logger.ts";
import nextConfig from "../next.config.js";

console.log("------------------------------------------------------------------");
console.log("🚀 STARTING PRODUCTION READINESS & DEPLOYMENT VERIFICATION SUITE");
console.log("------------------------------------------------------------------\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// ==========================================
// 1. Environment Variable Audit & Validation
// ==========================================
console.log("🔹 1. Environment Variables & Runtime Configuration");

test("auditProductionConfig validates core infrastructure without throwing", () => {
  const audit = auditProductionConfig();
  assert(typeof audit.isValid === "boolean");
  assert(Array.isArray(audit.warnings));
  assert(Array.isArray(audit.errors));
  assert(audit.details);
  assert.equal(audit.details.hasDatabase, true);
  assert(audit.details.nodeEnv);
});

test("Runtime environment contains required network and port bindings", () => {
  assert(typeof env.PORT === "number");
  assert(env.PORT > 0);
  assert(typeof env.HOST === "string");
  assert(env.APP_URL);
  assert(env.NEXTAUTH_URL);
});

// ==========================================
// 2. Next.js Production Configuration & Security
// ==========================================
console.log("\n🔹 2. Next.js Production Configuration & Security Headers");

test("next.config.js enforces strict production hardening flags", () => {
  assert.equal(nextConfig.reactStrictMode, true);
  assert.equal(nextConfig.poweredByHeader, false);
  assert.equal(nextConfig.compress, true);
  assert.equal(nextConfig.productionBrowserSourceMaps, false);
  assert(nextConfig.compiler);
  assert(Array.isArray(nextConfig.serverExternalPackages));
  assert(nextConfig.serverExternalPackages.includes("sharp"));
  assert(nextConfig.serverExternalPackages.includes("@prisma/client"));
});

test("next.config.js image configuration enforces 30-day cache and next-gen formats", () => {
  assert(nextConfig.images);
  assert(nextConfig.images.formats.includes("image/avif"));
  assert(nextConfig.images.formats.includes("image/webp"));
  assert.equal(nextConfig.images.minimumCacheTTL, 2592000); // 30 days
  assert(Array.isArray(nextConfig.images.remotePatterns));
  assert(nextConfig.images.remotePatterns.some((p) => p.hostname === "images.unsplash.com"));
});

await asyncTest("next.config.js security headers include HSTS, X-Frame-Options, and nosniff", async () => {
  assert(typeof nextConfig.headers === "function");
  const headersList = await nextConfig.headers();
  const globalHeaderObj = headersList.find((h) => h.source === "/:path*");
  assert(globalHeaderObj, "Global security header entry not found");

  const headerMap = new Map(globalHeaderObj.headers.map((h) => [h.key, h.value]));
  assert.equal(headerMap.get("X-Frame-Options"), "SAMEORIGIN");
  assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headerMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert(headerMap.has("Strict-Transport-Security"));
  assert(headerMap.has("Permissions-Policy"));
  assert.equal(headerMap.get("X-DNS-Prefetch-Control"), "on");
});

// ==========================================
// 3. Structured Production Logging
// ==========================================
console.log("\n🔹 3. Structured Production Logging & Redaction");

test("Logger formats JSON output in production mode and sanitizes credentials", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const intercepted = [];
    const origConsoleLog = console.log;
    console.log = (msg) => intercepted.push(msg);

    const testLogger = new Logger({ module: "test-prod" });
    testLogger.info("Payment received", {
      cardNumber: "4111222233334444",
      cvv: "123",
      password: "secret_admin_pass",
      amount: 45000,
    });

    console.log = origConsoleLog;

    assert.equal(intercepted.length, 1);
    const parsed = JSON.parse(intercepted[0]);
    assert.equal(parsed.level, "info");
    assert.equal(parsed.message, "Payment received");
    assert.equal(parsed.data.cardNumber, "[REDACTED]");
    assert.equal(parsed.data.cvv, "[REDACTED]");
    assert.equal(parsed.data.password, "[REDACTED]");
    assert.equal(parsed.data.amount, 45000);
    assert(parsed.timestamp);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

// ==========================================
// 4. Monitoring & Telemetry
// ==========================================
console.log("\n🔹 4. Monitoring & Telemetry Engine");

test("getSystemMetrics reports memory, CPU, Node runtime, and cache metrics", () => {
  const metrics = getSystemMetrics();
  assert(metrics.uptimeSeconds >= 0);
  assert(typeof metrics.uptimeFormatted === "string");
  assert(metrics.memory.heapUsedMb > 0);
  assert(metrics.memory.heapTotalMb > 0);
  assert(metrics.memory.rssMb > 0);
  assert(typeof metrics.memory.isConstrained === "boolean");
  assert(metrics.cpu);
  assert(metrics.node.version.startsWith("v"));
  assert(metrics.cache);
  assert(typeof metrics.cache.hitRate === "string");
});

test("formatUptime properly converts duration into human-readable intervals", () => {
  assert.equal(formatUptime(45), "45s");
  assert.equal(formatUptime(125), "2m 5s");
  assert.equal(formatUptime(3665), "1h 1m 5s");
  assert.equal(formatUptime(90061), "1d 1h 1m 1s");
});

// ==========================================
// 5. System Health Probes
// ==========================================
console.log("\n🔹 5. System Health Probes & Comprehensive Diagnostics");

await asyncTest("checkDatabaseHealth executes SELECT 1 and records latency", async () => {
  const dbHealth = await checkDatabaseHealth();
  assert(dbHealth.status === "UP" || dbHealth.status === "DOWN");
  assert(typeof dbHealth.latencyMs === "number");
  assert(dbHealth.latencyMs >= 0);
});

await asyncTest("getComprehensiveHealthReport synthesizes database, telemetry, and configuration status", async () => {
  const report = await getComprehensiveHealthReport();
  assert(["healthy", "degraded", "unhealthy"].includes(report.status));
  assert(report.timestamp);
  assert(report.database);
  assert(report.system);
  assert(report.config);
  assert(typeof report.config.isValid === "boolean");
});

console.log("\n------------------------------------------------------------------");
console.log(`🎉 ALL ${passed}/${total} PRODUCTION READINESS TESTS PASSED SUCCESSFULLY!`);
console.log("------------------------------------------------------------------\n");

