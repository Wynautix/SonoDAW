# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY server.js ./
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --legacy-peer-deps

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# SonoDAW runs on 8080 by default in Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
