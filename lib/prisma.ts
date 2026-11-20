import { PrismaClient } from "@prisma/client";
import { dbCache } from "@/lib/cache";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaMiddlewareAttached: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "error", "warn"] : ["error", "warn"],
  });

const READ_ACTIONS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "count",
  "aggregate",
  "groupBy",
]);

const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

// Models that must never be cached (e.g. real-time chat sessions/messages, inquiries, saved searches)
const UNCACHEABLE_MODELS = new Set(["ChatMessage", "ChatSession", "Inquiry", "SearchHistory"]);

const queryCache = new Map<string, { data: any; expiresAt: number }>();
const QUERY_CACHE_TTL_MS = 15 * 1000; // 15-second ultra-fast in-memory read cache

if (!globalForPrisma.prismaMiddlewareAttached && typeof (prisma as any).$use === "function") {
  globalForPrisma.prismaMiddlewareAttached = true;

  (prisma as any).$use(async (params: any, next: (p: any) => Promise<any>) => {
    const { model, action, args } = params;

    // Immediately invalidate all caches on any database mutation so UI is 100% real-time
    if (WRITE_ACTIONS.has(action)) {
      const result = await next(params);
      queryCache.clear();
      try {
        dbCache.clear();
      } catch {
        // ignore
      }
      return result;
    }

    // Skip cache for non-read actions, uncacheable models, or password authentication lookups
    if (
      !model ||
      !READ_ACTIONS.has(action) ||
      UNCACHEABLE_MODELS.has(model) ||
      (model === "User" && args?.select?.password)
    ) {
      return next(params);
    }

    let cacheKey = "";
    try {
      cacheKey = `${model}:${action}:${JSON.stringify(args || {})}`;
    } catch {
      return next(params);
    }

    const now = Date.now();
    const cached = queryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const result = await next(params);

    if (queryCache.size > 500) {
      for (const [k, v] of queryCache.entries()) {
        if (v.expiresAt <= now) queryCache.delete(k);
      }
      if (queryCache.size > 500) {
        const firstKey = queryCache.keys().next().value;
        if (firstKey) queryCache.delete(firstKey);
      }
    }

    queryCache.set(cacheKey, {
      data: result,
      expiresAt: now + QUERY_CACHE_TTL_MS,
    });

    return result;
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
