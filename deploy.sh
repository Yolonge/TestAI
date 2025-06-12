#!/bin/bash

echo "Начинаем деплой приложения CodeDuel..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "Docker не установлен. Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker установлен. Пожалуйста, выйдите и снова войдите в систему, затем запустите скрипт снова."
    exit
fi

# Проверка наличия Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose не установлен. Установка Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo "Docker Compose установлен."
fi

# Остановка и удаление существующих контейнеров
echo "Останавливаем и удаляем существующие контейнеры..."
docker compose down

# Сборка и запуск контейнеров
echo "Собираем и запускаем контейнеры..."
docker compose build
docker compose up -d

echo "Деплой завершен! Приложение доступно по адресу http://176.109.111.167" 