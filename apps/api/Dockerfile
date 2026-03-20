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

# Build shared packages
RUN npm run build --workspace=@beauty/shared-types || true
RUN npm run build --workspace=@beauty/shared-validators || true
RUN npm run build --workspace=@beauty/shared-utils || true
RUN npm run build --workspace=@beauty/shared-i18n || true

# Generate Prisma client & build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx tsc

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
