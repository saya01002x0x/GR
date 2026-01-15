# Backend Dockerfile - NestJS
# NOTE: Build context is project root, not backend/
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

# Copy backend package
COPY backend/package.json ./backend/

# Install all dependencies (workspace + backend)
WORKDIR /workspace/backend
RUN cd /workspace/packages/shared && pnpm install && pnpm build
RUN pnpm install --ignore-scripts

# Development stage
FROM base AS dev
WORKDIR /app

# Copy shared package for runtime
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Copy backend node_modules
COPY --from=deps /workspace/backend/node_modules ./node_modules

# Copy backend code
COPY backend ./

# Expose port
EXPOSE 3001

# Start dev server with hot reload
CMD ["pnpm", "run", "start:dev"]

# Builder stage for production
FROM base AS builder
WORKDIR /app

# Copy shared package
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Copy node_modules and backend code
COPY --from=deps /workspace/backend/node_modules ./node_modules
COPY backend ./

# Build the app
RUN pnpm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy shared package
COPY --from=deps /workspace/packages/shared /workspace/packages/shared

# Install production dependencies
COPY backend/package.json ./
RUN pnpm install --prod --ignore-scripts

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start production server
CMD ["node", "dist/main"]
