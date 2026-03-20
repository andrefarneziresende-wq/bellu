# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Install & Build ----
FROM base AS builder
WORKDIR /app

# Copy everything
COPY package.json package-lock.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY tsconfig.base.json ./

# Install all dependencies
RUN npm ci

# Build shared packages
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

# Copy the entire built workspace (keeps symlinks intact)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 3333

WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
