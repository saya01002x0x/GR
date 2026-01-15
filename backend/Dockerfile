# Backend Dockerfile - NestJS
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Development stage
FROM base AS dev
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3001

# Start dev server with hot reload
CMD ["npm", "run", "start:dev"]

# Builder stage for production
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start production server
CMD ["node", "dist/main"]
