/**
 * Enterprise Structured Logger for Kiro-Maal Real Estate Platform.
 *
 * Features:
 * - Levels: DEBUG, INFO, WARN, ERROR
 * - Auto-sanitizes sensitive data (passwords, tokens, secrets, API keys, card numbers)
 * - Trace/Correlation ID support for request tracing
 * - Development: Formatted, readable output with contextual badges
 * - Production: Structured JSON logging (compatible with CloudWatch, Datadog, Vercel)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "creditcard",
  "cvv",
  "cardnumber",
  "accountnumber",
  "privatekey",
  "client_secret",
]);

/**
 * Deeply redacts sensitive keys from objects to prevent leaking credentials into logs.
 */
export function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 6) return "[DEPTH_LIMIT]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Mask potential JWT tokens or Bearer tokens
    if (/^Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(data)) {
      return "Bearer [REDACTED_JWT]";
    }
    return data;
  }

  if (typeof data !== "object") return data;

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === "development" ? data.stack : undefined,
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeData(val, depth + 1);
    }
  }

  return sanitized;
}

export interface LogContext {
  requestId?: string;
  module?: string;
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: unknown;
}

export class Logger {
  private defaultContext: LogContext;
  private minLevel: LogLevel;

  constructor(defaultContext: LogContext = {}) {
    this.defaultContext = defaultContext;
    const configuredLevel = (process.env.LOG_LEVEL || "").toLowerCase() as LogLevel;
    this.minLevel =
      configuredLevel in LEVEL_SEVERITY
        ? configuredLevel
        : process.env.NODE_ENV === "production"
        ? "info"
        : "debug";
  }

  /**
   * Spawns a child logger that inherits and extends current context (e.g. for a specific request or module).
   */
  child(extraContext: LogContext): Logger {
    return new Logger({
      ...this.defaultContext,
      ...extraContext,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, data?: unknown, extraContext?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitizeData({
        ...this.defaultContext,
        ...extraContext,
      }) as LogContext,
      data: data !== undefined ? sanitizeData(data) : undefined,
    };
  }

  private write(entry: LogEntry): void {
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
      // In production, emit compact single-line JSON for log aggregators
      const jsonOutput = JSON.stringify(entry);
      if (entry.level === "error") {
        console.error(jsonOutput);
      } else if (entry.level === "warn") {
        console.warn(jsonOutput);
      } else {
        console.log(jsonOutput);
      }
    } else {
      // In development, emit clear readable badges with timestamps
      const badge =
        entry.level === "error"
          ? "🔴 [ERROR]"
          : entry.level === "warn"
          ? "🟡 [WARN]"
          : entry.level === "info"
          ? "🔵 [INFO]"
          : "⚪ [DEBUG]";

      const ctxParts: string[] = [];
      if (entry.context?.requestId) ctxParts.push(`req:${entry.context.requestId}`);
      if (entry.context?.module) ctxParts.push(`[${entry.context.module}]`);
      if (entry.context?.path) ctxParts.push(`${entry.context.method || "GET"} ${entry.context.path}`);

      const ctxHeader = ctxParts.length > 0 ? ` (${ctxParts.join(" ")})` : "";
      const timeStr = entry.timestamp.slice(11, 19);

      const header = `${badge} ${timeStr}${ctxHeader}: ${entry.message}`;

      if (entry.level === "error") {
        console.error(header, entry.data || "");
      } else if (entry.level === "warn") {
        console.warn(header, entry.data || "");
      } else {
        console.log(header, entry.data || "");
      }
    }
  }

  debug(message: string, data?: unknown, extraContext?: LogContext): void {
    if (this.shouldLog("debug")) {
      this.write(this.formatEntry("debug", message, data, extraContext));
    }
  }

  info(message: string, data?: unknown, extraContext?: LogContext): void {
    if (this.shouldLog("info")) {
      this.write(this.formatEntry("info", message, data, extraContext));
    }
  }

  warn(message: string, data?: unknown, extraContext?: LogContext): void {
    if (this.shouldLog("warn")) {
      this.write(this.formatEntry("warn", message, data, extraContext));
    }
  }

  error(message: string, errorOrData?: unknown, extraContext?: LogContext): void {
    if (this.shouldLog("error")) {
      this.write(this.formatEntry("error", message, errorOrData, extraContext));
    }
  }
}

/** Global default logger singleton */
export const logger = new Logger({ module: "app" });
