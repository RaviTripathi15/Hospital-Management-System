# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package config files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy all files
COPY . .

# Pass environment variables for production build
ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build optimized bundles
RUN npm run build

# Stage 2: Serve the build directory using Nginx
FROM nginx:alpine

# Copy built files to Nginx default html path
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx config file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
