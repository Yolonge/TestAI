FROM node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /appAdd commentMore actions

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Запускаем приложение
CMD ["npm", "start"]

EXPOSE 3000 