# Stage 1: Build
FROM node:24-bookworm AS builder
WORKDIR /app

# This line installs git so npm can download your proxy parts
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    build-essential \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist

# Sync with Railway settings
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
