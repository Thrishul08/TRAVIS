FROM node:18-alpine

WORKDIR /app

RUN addgroup -S travis && adduser -S travis -G travis

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

RUN chown -R travis:travis /app

USER travis

# Removed: MONGO_URI, JWT_SECRET, AI_BASE_URL — never bake secrets into images.
# NODE_ENV is set in .env and passed in by docker-compose env_file.
# This ENV block only sets non-sensitive, container-topology defaults
# that have no meaning outside Docker and carry no secret value.
ENV NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => { if (r.statusCode !== 200) process.exit(1) })" || exit 1

CMD ["node", "index.js"]