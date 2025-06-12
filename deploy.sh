#!/bin/bash

# Остановка и удаление старых контейнеров
echo "Останавливаем и удаляем старые контейнеры..."
docker compose -f compose.production.yaml down || true

# Удаление всех образов с тегом <none>
echo "Удаляем неиспользуемые образы..."
docker images | grep "<none>" | awk '{print $3}' | xargs docker rmi -f || true

# Сборка новых образов
echo "Собираем новые образы..."
docker compose -f compose.production.yaml build

# Запуск контейнеров
echo "Запускаем контейнеры..."
docker compose -f compose.production.yaml up -d

# Проверка статуса контейнеров
echo "Проверяем статус контейнеров..."
docker compose -f compose.production.yaml ps

echo "Деплой завершен!" 