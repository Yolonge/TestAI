#!/bin/bash

echo "Запуск миграций базы данных..."

# Запускаем миграцию в контейнере
docker compose exec codeduelplatform dotnet ef database update

echo "Миграция базы данных завершена!" 