/**
 * Comprehensive Automated Verification Suite for Error Handling & Recovery System
 * Platform: Kiro-Maal Luxury Real Estate
 */

import assert from "node:assert/strict";
import {
  AppError,
  translatePrismaError,
  formatErrorResponse,
  generateRequestId,
  isRetryableError,
  withRetry,
  ERROR_MESSAGES,
} from "../lib/api-error.ts";
import { sanitizeData, Logger } from "../lib/logger.ts";
import { CLIENT_ERROR_CATALOG, getFriendlyErrorMessage } from "../lib/client-error.ts";

console.log("------------------------------------------------------------------");
console.log("🧪 STARTING ERROR HANDLING & RECOVERY VERIFICATION SUITE");
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
// 1. AppError & Bilingual Translation Tests
// ==========================================
console.log("🔹 1. AppError & Bilingual Translation Tests");

test("AppError factory methods set correct status codes and Somali translations", () => {
  const badReq = AppError.badRequest("Invalid input");
  assert.equal(badReq.status, 400);
  assert.equal(badReq.code, "BAD_REQUEST");
  assert.equal(badReq.messageSo, ERROR_MESSAGES.BAD_REQUEST.so);

  const unauth = AppError.unauthorized();
  assert.equal(unauth.status, 401);
  assert.equal(unauth.code, "UNAUTHORIZED");
  assert.equal(unauth.messageSo, ERROR_MESSAGES.UNAUTHORIZED.so);

  const forbidden = AppError.forbidden();
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.code, "FORBIDDEN");
  assert.equal(forbidden.messageSo, ERROR_MESSAGES.FORBIDDEN.so);

  const notFound = AppError.notFound();
  assert.equal(notFound.status, 404);
  assert.equal(notFound.code, "NOT_FOUND");
  assert.equal(notFound.messageSo, ERROR_MESSAGES.NOT_FOUND.so);

  const conflict = AppError.conflict();
  assert.equal(conflict.status, 409);
  assert.equal(conflict.code, "CONFLICT");
  assert.equal(conflict.messageSo, ERROR_MESSAGES.CONFLICT.so);

  const rateLimit = AppError.rateLimited();
  assert.equal(rateLimit.status, 429);
  assert.equal(rateLimit.code, "RATE_LIMITED");
  assert.equal(rateLimit.messageSo, ERROR_MESSAGES.RATE_LIMITED.so);

  const internal = AppError.internal();
  assert.equal(internal.status, 500);
  assert.equal(internal.code, "INTERNAL_ERROR");
  assert.equal(internal.messageSo, ERROR_MESSAGES.INTERNAL_ERROR.so);
});

// ==========================================
// 2. Prisma ORM Error Sanitizer Tests
// ==========================================
console.log("\n🔹 2. Prisma ORM Error Sanitizer Tests");

test("translatePrismaError masks P2002 unique constraint without leaking SQL table details", () => {
  const prismaP2002 = {
    code: "P2002",
    meta: { target: ["slug"] },
    message: "Unique constraint failed on the fields: (`slug`) in table `properties`",
  };
  const appError = translatePrismaError(prismaP2002);
  assert(appError !== null);
  assert.equal(appError.status, 409);
  assert.equal(appError.code, "CONFLICT");
  assert(appError.message.includes("slug already exists"));
  assert(!appError.message.includes("in table `properties`"));
  assert(appError.messageSo && appError.messageSo.length > 0);
});

test("translatePrismaError handles P2025 record not found", () => {
  const prismaP2025 = {
    code: "P2025",
    message: "An operation failed because it depends on one or more records that were required but not found.",
  };
  const appError = translatePrismaError(prismaP2025);
  assert(appError !== null);
  assert.equal(appError.status, 404);
  assert.equal(appError.code, "NOT_FOUND");
  assert.equal(appError.messageSo, "Diiwaanka la raadinayo lama helin ama waa la tirtiray.");
});

test("translatePrismaError handles P2024 connection pool timeout", () => {
  const prismaP2024 = {
    code: "P2024",
    message: "Timed out fetching a new connection from the connection pool.",
  };
  const appError = translatePrismaError(prismaP2024);
  assert(appError !== null);
  assert.equal(appError.status, 503);
  assert.equal(appError.code, "DATABASE_ERROR");
  assert(appError.message.includes("Database connection timed out"));
});

// ==========================================
// 3. Request Correlation & Error Formatting
// ==========================================
console.log("\n🔹 3. Request Correlation & Error Formatting Tests");

test("generateRequestId produces valid unique correlation identifiers", () => {
  const id1 = generateRequestId();
  const id2 = generateRequestId();
  assert(id1.startsWith("req_"));
  assert(id2.startsWith("req_"));
  assert.notEqual(id1, id2);
});

test("formatErrorResponse encapsulates correlation ID, timestamp, and sanitized details", () => {
  const reqId = "req_test_abc123";
  const err = AppError.badRequest("Invalid search parameters", { password: "secret_value", page: 1 });
  const { status, payload } = formatErrorResponse(err, undefined, reqId, "test-module");

  assert.equal(status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.code, "BAD_REQUEST");
  assert.equal(payload.requestId, reqId);
  assert(payload.timestamp);
  // Ensure sensitive field in details was redacted
  assert.equal(payload.details.password, "[REDACTED]");
  assert.equal(payload.details.page, 1);
});

// ==========================================
// 4. Sensitive Data Redaction in Logger
// ==========================================
console.log("\n🔹 4. Sensitive Data Redaction in Logger Tests");

test("sanitizeData scrubs credentials, tokens, cards, and authorization headers", () => {
  const sensitiveObj = {
    user: "customer@kiromaal.com",
    password: "SuperSecretPassword123!",
    token: "session_token_xyz",
    authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYifQ.dummy_signature",
    cardNumber: "4111222233334444",
    cvv: "123",
    nested: {
      apiKey: "sk_live_998877665544",
      secret: "whsec_abcdef123456",
      publicInfo: "safe_to_log",
    },
  };

  const sanitized = sanitizeData(sensitiveObj);
  assert.equal(sanitized.user, "customer@kiromaal.com");
  assert.equal(sanitized.password, "[REDACTED]");
  assert.equal(sanitized.token, "[REDACTED]");
  assert.equal(sanitized.authorization, "[REDACTED]");
  assert.equal(sanitized.cardNumber, "[REDACTED]");
  assert.equal(sanitized.cvv, "[REDACTED]");
  assert.equal(sanitized.nested.apiKey, "[REDACTED]");
  assert.equal(sanitized.nested.secret, "[REDACTED]");
  assert.equal(sanitized.nested.publicInfo, "safe_to_log");
});

test("sanitizeData masks raw JWT bearer strings", () => {
  const rawJwtBearer = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature";
  const masked = sanitizeData(rawJwtBearer);
  assert.equal(masked, "Bearer [REDACTED_JWT]");
});

// ==========================================
// 5. Transient Error Detection & Retry Logic
// ==========================================
console.log("\n🔹 5. Transient Error Detection & Retry Logic Tests");

test("isRetryableError correctly classifies retryable transient vs fatal client errors", () => {
  // Retryable errors
  assert.equal(isRetryableError(new Error("fetch failed")), true);
  assert.equal(isRetryableError(new Error("connect ECONNRESET 127.0.0.1:5432")), true);
  assert.equal(isRetryableError(new Error("Socket hang up")), true);
  assert.equal(isRetryableError(new Error("Prisma error: P2024 connection timeout")), true);
  assert.equal(isRetryableError(AppError.rateLimited()), true);
  assert.equal(isRetryableError(new AppError({ message: "Gateway Timeout", status: 504 })), true);
  assert.equal(isRetryableError(new AppError({ message: "Service Unavailable", status: 503 })), true);

  // Non-retryable errors
  assert.equal(isRetryableError(AppError.badRequest("Validation failed")), false);
  assert.equal(isRetryableError(AppError.unauthorized()), false);
  assert.equal(isRetryableError(AppError.forbidden()), false);
  assert.equal(isRetryableError(AppError.notFound()), false);
});

await asyncTest("withRetry successfully succeeds after transient failure", async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("network error: temporary socket timeout");
      }
      return "SUCCESS_DATA";
    },
    { retries: 3, delayMs: 10, jitter: true }
  );

  assert.equal(result, "SUCCESS_DATA");
  assert.equal(attempts, 3);
});

await asyncTest("withRetry does NOT retry non-retryable 4xx client errors", async () => {
  let attempts = 0;
  try {
    await withRetry(
      async () => {
        attempts++;
        throw AppError.badRequest("Invalid email address");
      },
      { retries: 3, delayMs: 10 }
    );
    assert.fail("Should have thrown AppError");
  } catch (err) {
    assert.equal(attempts, 1); // Must NOT retry 400
    assert.equal(err.code, "BAD_REQUEST");
  }
});

// ==========================================
// 6. Client Friendly Error Catalog & Translator
// ==========================================
console.log("\n🔹 6. Client Friendly Error Catalog & Translator Tests");

test("getFriendlyErrorMessage translates HTTP status codes and patterns to bilingual messages", () => {
  const offlineMsg = getFriendlyErrorMessage("Failed to fetch (offline network error)");
  assert.equal(offlineMsg.title, CLIENT_ERROR_CATALOG.OFFLINE.title);
  assert.equal(offlineMsg.titleSo, CLIENT_ERROR_CATALOG.OFFLINE.titleSo);
  assert.equal(offlineMsg.isOffline, true);

  const timeoutMsg = getFriendlyErrorMessage("Request aborted after timeout 504");
  assert.equal(timeoutMsg.title, CLIENT_ERROR_CATALOG.TIMEOUT.title);
  assert.equal(timeoutMsg.titleSo, CLIENT_ERROR_CATALOG.TIMEOUT.titleSo);

  const unauthMsg = getFriendlyErrorMessage("HTTP 401: Unauthorized access");
  assert.equal(unauthMsg.title, CLIENT_ERROR_CATALOG.UNAUTHORIZED.title);
  assert.equal(unauthMsg.titleSo, CLIENT_ERROR_CATALOG.UNAUTHORIZED.titleSo);

  const notFoundMsg = getFriendlyErrorMessage("Listing 404 not found");
  assert.equal(notFoundMsg.title, CLIENT_ERROR_CATALOG.NOT_FOUND.title);
  assert.equal(notFoundMsg.titleSo, CLIENT_ERROR_CATALOG.NOT_FOUND.titleSo);

  const rateLimitMsg = getFriendlyErrorMessage("429 rate limit exceeded");
  assert.equal(rateLimitMsg.title, CLIENT_ERROR_CATALOG.RATE_LIMITED.title);
  assert.equal(rateLimitMsg.titleSo, CLIENT_ERROR_CATALOG.RATE_LIMITED.titleSo);

  const serverMsg = getFriendlyErrorMessage("500 internal server error");
  assert.equal(serverMsg.title, CLIENT_ERROR_CATALOG.SERVER_ERROR.title);
  assert.equal(serverMsg.titleSo, CLIENT_ERROR_CATALOG.SERVER_ERROR.titleSo);
});

console.log("\n------------------------------------------------------------------");
console.log(`🎉 ALL ${passed}/${total} ERROR HANDLING TESTS PASSED SUCCESSFULLY!`);
console.log("------------------------------------------------------------------\n");
