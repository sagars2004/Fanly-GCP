# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies definitions
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Disable telemetry and build next application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Runtime image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build output, next config and public assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
