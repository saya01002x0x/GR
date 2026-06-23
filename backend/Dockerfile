# ============================================
# Backend Dockerfile - NestJS + Prisma
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
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

# === STAGE 2: Build shared + backend ===
FROM deps AS build

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY backend/ ./backend/

# Build shared package first (backend depends on it)
RUN pnpm --filter @gr/shared build

# Generate Prisma client + Build NestJS
RUN cd backend && npx prisma generate && pnpm run build

# Create production bundle using pnpm deploy
# This resolves workspace deps (@gr/shared) and includes only prod node_modules
RUN pnpm --filter backend deploy --prod /prod/backend

# === STAGE 3: Production Image (minimal) ===
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install prisma CLI globally (for running migrations on VPS)
RUN npm install -g prisma

# Copy production bundle from pnpm deploy
COPY --from=build /prod/backend ./

# Ensure built output is present
COPY --from=build /workspace/backend/dist ./dist

# Copy Prisma schema + migrations
COPY --from=build /workspace/backend/prisma ./prisma

# Copy generated Prisma client
COPY --from=build /workspace/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5145

CMD ["node", "dist/main"]
