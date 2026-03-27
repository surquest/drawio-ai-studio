# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Mount the secret file temporarily during the build
RUN --mount=type=secret,id=env_file \
    cp /run/secrets/env_file .env.production && \
    npm run build && \
    rm -f .env.production

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install serve to host the static exported site
RUN npm install -g serve

# Cloud Run expects the app to listen on the PORT env variable
ENV PORT 8080

# Next.js 'output: export' generates its files in the /app/out directory
COPY --from=builder /app/out ./out

EXPOSE 8080
CMD serve -s out -l tcp://0.0.0.0:${PORT}