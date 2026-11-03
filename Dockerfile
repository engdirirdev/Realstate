# Multi-Stage Production Dockerfile for Kiro-Maal Real Estate Platform
# Optimized for minimum image footprint, maximum security, and rapid startup.

# 1. Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for linux-musl target
RUN npx prisma generate

# Build Next.js with standalone output
ENV STANDALONE="true"
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Production Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST="0.0.0.0"

# Create unprivileged system user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
