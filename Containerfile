FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# Set working directory
WORKDIR /opt/app-root/src

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the entrypoint script first
COPY docker-entrypoint.sh /opt/app-root/src/

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Make the entrypoint script executable
USER root
RUN chmod +x /opt/app-root/src/docker-entrypoint.sh
USER 1001

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Use entrypoint script to generate runtime config
ENTRYPOINT ["/opt/app-root/src/docker-entrypoint.sh"]

# Start the application using preview mode to serve built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
