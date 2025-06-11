FROM node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Этап установки зависимостей
FROM base AS deps
# Копируем файлы package.json и package-lock.json
COPY package.json package-lock.json ./
# Устанавливаем зависимости
RUN npm ci

# Этап сборки приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Создаем production сборку
RUN npm run build

# Этап production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Создаем пользователя с ограниченными правами
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем только необходимые файлы из предыдущего этапа
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Устанавливаем правильные разрешения
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Запускаем приложение
CMD ["node", "server.js"]
