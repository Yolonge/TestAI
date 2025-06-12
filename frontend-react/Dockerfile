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

# Для режима standalone нужно скопировать файлы в соответствующий каталог
RUN cp -R public ./.next/standalone/public
RUN cp -R .next/static ./.next/standalone/.next/static

WORKDIR /app/.next/standalone

# Запускаем приложение правильным способом для режима standalone
CMD ["node", "server.js"]

EXPOSE 3000 