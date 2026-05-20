# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# No default value — if REACT_APP_API_URL isn't passed from docker-compose, the build fails
# loudly rather than silently baking in a wrong URL.
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

RUN addgroup -S travis && adduser -S travis -G travis

RUN npm install -g serve@14

COPY --from=builder /app/build ./build

RUN chown -R travis:travis /app

USER travis

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => { if (r.statusCode !== 200) process.exit(1) })" || exit 1

CMD ["serve", "-s", "build", "-l", "3000"]