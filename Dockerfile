# Stage 1: Build the React/Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with nginx on HA base image
FROM ghcr.io/home-assistant/base:latest
RUN apk add --no-cache nginx

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config and entrypoint
COPY nginx.conf /etc/nginx/nginx.conf
COPY run.sh /run.sh
RUN chmod +x /run.sh && mkdir -p /run/s6/container_environment

CMD ["/run.sh"]
