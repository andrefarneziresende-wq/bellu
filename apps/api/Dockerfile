FROM node:20-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy entire monorepo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies (creates proper workspace symlinks)
RUN npm ci

# Build shared packages
RUN cd packages/shared-types && npx tsc
RUN cd packages/shared-validators && npx tsc
RUN cd packages/shared-utils && npx tsc
RUN cd packages/shared-i18n && npx tsc

# Generate Prisma client & build API
RUN cd apps/api && npx prisma generate && npx tsc

# Verify the build works
RUN ls -la node_modules/@beauty/shared-validators/dist/index.js

ENV NODE_ENV=production
EXPOSE 3333
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
