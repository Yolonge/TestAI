FROM node:18-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Настраиваем запуск в режиме standalone
WORKDIR /app/.next/standalone

# Копируем статические файлы и публичные ресурсы
COPY --from=0 /app/.next/static /app/.next/standalone/.next/static
COPY --from=0 /app/public /app/.next/standalone/public

# Запускаем приложение
CMD ["node", "server.js"]

EXPOSE 3000 