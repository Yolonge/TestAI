#!/bin/bash

# Обновление пакетов
sudo apt update
sudo apt upgrade -y

# Установка Docker и Docker Compose
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo apt install -y docker-compose

# Создание каталога для проекта
mkdir -p /app
cd /app

# Клонирование репозитория (замените на свой репозиторий)
# git clone https://github.com/your-username/your-repo.git .

# Копирование файлов (если вы загружаете их вручную)
# scp -r * username@176.109.111.167:/app/

# Запуск контейнеров
sudo docker-compose up -d

# Применение миграций (если необходимо)
sudo docker-compose exec codeduelplatform dotnet ef database update

echo "Деплой завершен. Приложение доступно по адресу http://176.109.111.167" 