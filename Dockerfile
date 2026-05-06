# Stage 1: Build
FROM node:24-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y git python3 make g++ build-essential libcurl4-openssl-dev && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:24-slim
WORKDIR /app
COPY --from=builder /app ./

# This forces the app to use the correct network settings
ENV PORT=2345
ENV HOST=0.0.0.0

EXPOSE 2345

# We use the env variables directly in the start command
CMD ["node", "server.js", "--host", "0.0.0.0", "--port", "2345"]
