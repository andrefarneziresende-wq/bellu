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

# Copy node_modules (without workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules

# Copy built shared packages
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/packages/shared-validators ./packages/shared-validators
COPY --from=builder /app/packages/shared-utils ./packages/shared-utils
COPY --from=builder /app/packages/shared-i18n ./packages/shared-i18n

# Copy API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

# Recreate workspace symlinks manually
RUN ln -sf /app/packages/shared-types /app/node_modules/@beauty/shared-types && \
    ln -sf /app/packages/shared-validators /app/node_modules/@beauty/shared-validators && \
    ln -sf /app/packages/shared-utils /app/node_modules/@beauty/shared-utils && \
    ln -sf /app/packages/shared-i18n /app/node_modules/@beauty/shared-i18n

EXPOSE 3333

WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
