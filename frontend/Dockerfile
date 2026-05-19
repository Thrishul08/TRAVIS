# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept API_URL as build argument (defaults to localhost for local development)
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (dev included — needed for react-scripts build)
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# -----------------------------------------------------------------------
# Production stage — only the built output, no source or node_modules
# -----------------------------------------------------------------------
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S travis && adduser -S travis -G travis

# Pin serve version for reproducibility
RUN npm install -g serve@14

# Copy ONLY the build output from builder — nothing else
COPY --from=builder /app/build ./build

# Give ownership to non-root user
RUN chown -R travis:travis /app

USER travis

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => { if (r.statusCode !== 200) process.exit(1) })" || exit 1

CMD ["serve", "-s", "build", "-l", "3000"]