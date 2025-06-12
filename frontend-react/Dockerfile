FROM node:18-alpine AS build

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package.json package-lock.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Запуск приложения
CMD ["npm", "start"]

# Открываем порт
EXPOSE 3000 