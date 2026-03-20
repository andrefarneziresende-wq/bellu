# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-validators/package.json ./packages/shared-validators/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-i18n/package.json ./packages/shared-i18n/
RUN npm ci

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
RUN cd packages/shared-types && npx tsc
RUN cd packages/shared-validators && npx tsc
RUN cd packages/shared-utils && npx tsc
RUN cd packages/shared-i18n && npx tsc

# Generate Prisma client & build API
RUN cd apps/api && npx prisma generate && npx tsc

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built shared packages
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-validators/dist ./packages/shared-validators/dist
COPY --from=builder /app/packages/shared-validators/package.json ./packages/shared-validators/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/packages/shared-i18n/dist ./packages/shared-i18n/dist
COPY --from=builder /app/packages/shared-i18n/locales ./packages/shared-i18n/locales
COPY --from=builder /app/packages/shared-i18n/package.json ./packages/shared-i18n/

# Copy API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy root package files and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
