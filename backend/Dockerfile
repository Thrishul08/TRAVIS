FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S travis && adduser -S travis -G travis

# Copy package files first (layer cache — only reinstalls if package.json changes)
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Give ownership to non-root user
RUN chown -R travis:travis /app

USER travis

# AI_BASE_URL is intentionally NOT baked in at build time.
# Set it at runtime via docker-compose environment or docker run -e.
# Default points to the ai_services service name used in docker-compose.
ENV AI_BASE_URL=http://ai_services:5001

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => { if (r.statusCode !== 200) process.exit(1) })" || exit 1

CMD ["node", "index.js"]