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

# Удаляем старые образы для гарантии чистой сборки
echo "Удаляем старые образы..."
docker image rm -f frontend-react codeduelplatform 2>/dev/null || true

# Сборка и запуск контейнеров
echo "Собираем и запускаем контейнеры..."
docker compose build --no-cache
docker compose up -d

# Проверка статуса контейнеров
echo "Проверяем статус контейнеров..."
docker compose ps

# Проверка доступности сервисов
echo "Проверка доступности сервисов..."
echo "Nginx: curl http://localhost/static-check.html"
curl -s http://localhost/static-check.html | grep -q "Nginx работает" && echo "✅ Nginx доступен" || echo "❌ Nginx недоступен"

echo "Frontend: curl http://localhost/"
curl -s http://localhost/ > /dev/null && echo "✅ Frontend доступен" || echo "❌ Frontend недоступен"

echo "Backend: curl http://localhost/api/health"
curl -s http://localhost/api/health > /dev/null && echo "✅ Backend API доступен" || echo "❌ Backend API недоступен"

# Проверка логов контейнеров
echo "Последние логи контейнеров:"
echo "=== Nginx логи ==="
docker compose logs --tail=10 nginx
echo "=== Frontend логи ==="
docker compose logs --tail=10 frontend
echo "=== Backend логи ==="
docker compose logs --tail=10 codeduelplatform

echo "Деплой завершен! Приложение доступно по адресу http://176.109.111.167"
echo "Для проверки работоспособности откройте: http://176.109.111.167/static-check.html"
echo "Для просмотра логов используйте команду: docker compose logs -f" 