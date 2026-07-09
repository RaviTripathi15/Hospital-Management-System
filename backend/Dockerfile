# Use official Node.js alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories for logs and uploads
RUN mkdir -p logs uploads

# Expose server port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Start backend server
CMD ["node", "server.js"]
