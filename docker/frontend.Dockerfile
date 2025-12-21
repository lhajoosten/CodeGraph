# Multi-stage build for React frontend

FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install dependencies (use npm ci for Docker to respect package-lock.json)
RUN npm ci

# Copy application code
COPY apps/frontend/ .

# Development stage
FROM base AS development

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build

RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
