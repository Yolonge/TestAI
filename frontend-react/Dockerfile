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

# Устанавливаем netstat для отладки
RUN apk add --no-cache net-tools busybox-extras

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["sh", "-c", "echo 'Запуск Next.js приложения на порту 3000...' && NODE_ENV=production npm start"] 