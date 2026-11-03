/**
 * ================================================================
 * CENTRALIZED ENVIRONMENT VARIABLE VALIDATION & CONFIGURATION
 * ================================================================
 * Validates that all critical infrastructure secrets, database URLs,
 * and external service credentials are appropriately configured for
 * both development and production deployment.
 */

export interface AppEnv {
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  AUTH_SECRET: string;
  NEXTAUTH_URL: string;
  APP_URL: string;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  PORT: number;
  HOST: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  GOOGLE_AI_API_KEY?: string;
  GEMINI_MODEL: string;
  MONITORING_SECRET?: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface EnvValidationReport {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  details: {
    nodeEnv: string;
    hasDatabase: boolean;
    hasStrongAuthSecret: boolean;
    hasNextAuthUrl: boolean;
    aiProviderConfigured: boolean;
    logLevel: string;
  };
}

const INSECURE_DEFAULT_SECRETS = new Set([
  "your-super-secret-auth-secret-here",
  "dev-insecure-secret-replace-in-production",
  "secret",
  "changeme",
  "default_secret",
]);

/**
 * Validates the runtime environment and returns a structured AppEnv object.
 */
function validateEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV || "development") as AppEnv["NODE_ENV"];
  const isProduction = nodeEnv === "production";
  const isDevelopment = !isProduction;

  // 1. Database URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && isProduction) {
    throw new Error(
      "[Security Alert] Missing required DATABASE_URL environment variable in production."
    );
  }

  // 2. Auth Secret
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (isProduction) {
    if (!authSecret) {
      throw new Error(
        "[Security Alert] Missing required AUTH_SECRET environment variable in production. Run `openssl rand -base64 32` to generate one."
      );
    }
    if (INSECURE_DEFAULT_SECRETS.has(authSecret)) {
      throw new Error(
        "[Security Alert] AUTH_SECRET is set to an insecure default placeholder. Please generate a cryptographically strong secret."
      );
    }
  }

  // 3. Application Base URLs
  const nextAuthUrl =
    process.env.NEXTAUTH_URL ||
    (isProduction ? "https://kiromaal.com" : "http://localhost:3000");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    nextAuthUrl;

  // 4. Logging & Networking
  const logLevel = (process.env.LOG_LEVEL || (isProduction ? "info" : "debug")) as AppEnv["LOG_LEVEL"];
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  // 5. AI Configuration
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const googleKey =
    process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

  const monitoringSecret = process.env.MONITORING_SECRET?.trim();

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL: databaseUrl || "mysql://root:@localhost:3306/real_estate_ai",
    AUTH_SECRET: authSecret || "dev-insecure-secret-replace-in-production",
    NEXTAUTH_URL: nextAuthUrl,
    APP_URL: appUrl,
    LOG_LEVEL: logLevel,
    PORT: port,
    HOST: host,
    OPENAI_API_KEY: openaiKey,
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    GOOGLE_AI_API_KEY: googleKey,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    MONITORING_SECRET: monitoringSecret,
    isProduction,
    isDevelopment,
  };
}

/**
 * Validates configuration readiness and returns diagnostic summary without throwing.
 */
export function auditProductionConfig(): EnvValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push("DATABASE_URL is missing.");
  } else if (!dbUrl.startsWith("mysql://") && !dbUrl.startsWith("mysql2://") && !dbUrl.startsWith("postgresql://")) {
    warnings.push("DATABASE_URL does not use standard mysql or postgresql protocol.");
  }

  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  let hasStrongAuthSecret = false;
  if (!authSecret) {
    errors.push("AUTH_SECRET is not configured.");
  } else if (INSECURE_DEFAULT_SECRETS.has(authSecret)) {
    errors.push("AUTH_SECRET is set to an insecure default placeholder.");
  } else if (authSecret.length < 32) {
    warnings.push("AUTH_SECRET length is less than recommended 32 characters.");
    hasStrongAuthSecret = true;
  } else {
    hasStrongAuthSecret = true;
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    warnings.push("NEXTAUTH_URL is not set (will fallback to default host).");
  } else if (process.env.NODE_ENV === "production" && !nextAuthUrl.startsWith("https://")) {
    warnings.push("NEXTAUTH_URL does not use HTTPS in production.");
  }

  const hasAi = Boolean(process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  if (!hasAi) {
    warnings.push("No AI API keys configured (OPENAI_API_KEY or GOOGLE_AI_API_KEY). AI features run in heuristic mode.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      nodeEnv: process.env.NODE_ENV || "development",
      hasDatabase: Boolean(dbUrl),
      hasStrongAuthSecret,
      hasNextAuthUrl: Boolean(nextAuthUrl),
      aiProviderConfigured: hasAi,
      logLevel: process.env.LOG_LEVEL || "default",
    },
  };
}

export const env = validateEnv();
