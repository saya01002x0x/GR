# Frontend Dockerfile - Next.js
# NOTE: Build context is project root, not frontend/
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.16.1

# Install dependencies only when needed
FROM base AS deps
WORKDIR /workspace

# Copy workspace files first
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY package.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy frontend package
COPY frontend/package.json ./frontend/

# Install all dependencies (workspace + frontend)
WORKDIR /workspace/frontend
RUN cd /workspace/packages/shared && pnpm install && pnpm build
RUN pnpm install --ignore-scripts

# Development stage
FROM base AS dev
WORKDIR /app

# Copy shared package for runtime
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Copy frontend node_modules
COPY --from=deps /workspace/frontend/node_modules ./node_modules

# Copy frontend code
COPY frontend ./

# Expose port
EXPOSE 3000

# Start dev server with hot reload
CMD ["pnpm", "run", "dev"]

# Builder stage for production
FROM base AS builder
WORKDIR /app

# Copy shared package
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Copy node_modules and frontend code
COPY --from=deps /workspace/frontend/node_modules ./node_modules
COPY frontend ./

# Build the app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy shared package
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Install production dependencies
COPY frontend/package.json ./
RUN pnpm install --prod --ignore-scripts

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port
EXPOSE 3000

# Start production server
CMD ["pnpm", "start"]
