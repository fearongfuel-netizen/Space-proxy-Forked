# Stage 1: Build (The "Kitchen")
FROM node:24-bookworm AS builder
WORKDIR /app

# Installs git and building tools
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

# Stage 2: Run (The "Table")
FROM node:24-slim
WORKDIR /app

# Grab EVERY file from the builder stage to ensure masqr.js is there
COPY --from=builder /app ./

# Ensure Railway connects to the right port
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
