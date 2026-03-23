# ==========================================
# STAGE 1: Builder (TypeScript Compilation)
# ==========================================
FROM node:18-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install ALL dependencies (including devDependencies like TypeScript)
# 'npm ci' is faster and stricter than 'npm install' for automated environments
RUN npm ci --legacy-peer-deps

# Copy the rest of the API source code
COPY . .

# Compile TypeScript to JavaScript (this will generate the /dist folder)
RUN npm run build

# ==========================================
# STAGE 2: Production (Super light final image)
# ==========================================
FROM node:18-alpine AS production

# Set environment variable to optimize Express and other libraries
ENV NODE_ENV=production

WORKDIR /app

# Copy dependency files again
COPY package*.json ./

# Install ONLY production dependencies (ignores TypeScript, Nodemon, etc.)
RUN npm ci --omit=dev --legacy-peer-deps

# Copy ONLY the compiled /dist folder from the 'builder' stage
COPY --from=builder /app/dist ./dist

# (Optional) If you have static folders, email templates or public assets, copy them here
# COPY --from=builder /app/public ./public

# Expose the port your API will use (Make sure it matches your .env)
EXPOSE 5000

# Command to start the application in production
CMD ["node", "dist/index.js"]