FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение (исправлено для поддержки output: standalone)
CMD ["sh", "-c", "if [ -d .next/standalone ]; then node .next/standalone/server.js; else npm start; fi"] 