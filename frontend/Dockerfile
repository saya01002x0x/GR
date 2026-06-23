# ============================================
# Frontend Dockerfile - Next.js 16
# Build context: project root (GR/)
# ============================================

FROM node:20-alpine AS base
RUN npm install -g pnpm@10.16.1

# === STAGE 1: Install ALL dependencies ===
FROM base AS deps
WORKDIR /workspace

# Copy workspace config + ALL package.json (for lockfile integrity)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY ai-service/package.json ./ai-service/

RUN pnpm install --frozen-lockfile

# === STAGE 2: Build shared + frontend ===
FROM deps AS build

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY frontend/ ./frontend/

# Build shared package first
RUN pnpm --filter @gr/shared build

# NEXT_PUBLIC_* vars are embedded at build time
# These are passed via docker-compose build args
ARG NEXT_PUBLIC_APP_URL=https://luminaaaa.studio
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL=https://api.luminaaaa.studio
ARG CLERK_SECRET_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js
RUN pnpm --filter frontend build

# Create production bundle
RUN pnpm --filter frontend deploy --prod /prod/frontend

# === STAGE 3: Production Image (minimal) ===
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@10.16.1

# Copy production bundle from pnpm deploy
COPY --from=build /prod/frontend ./

# Copy Next.js build output
COPY --from=build /workspace/frontend/.next ./.next
COPY --from=build /workspace/frontend/public ./public
COPY --from=build /workspace/frontend/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["pnpm", "start"]
