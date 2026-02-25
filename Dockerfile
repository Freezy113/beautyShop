# Multi-stage build for BeautyShop Backend
# Решает проблему libssl.so.1.1: version OPENSSL_1_1_0 not found
# Используем Debian-based slim образ вместо Alpine для корректной работы OpenSSL

# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Устанавливаем OpenSSL и зависимости для Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Copy source code
COPY src ./src

# Генерируем Prisma Client ВНУТРИ контейнера сборки
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-slim AS production

WORKDIR /app

# Устанавливаем dumb-init и OpenSSL для Prisma
RUN apt-get update && apt-get install -y dumb-init openssl && rm -rf /var/lib/apt/lists/*

# Создаем non-root пользователя
RUN groupadd -r nodejs --gid=1001 && \
    useradd -r -g nodejs --uid=1001 nodejs

# Копируем только необходимые файлы из первого этапа
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Копируем сгенерированный клиент Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Устанавливаем владельца
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

ENV NODE_ENV=production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
