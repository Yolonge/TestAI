#!/bin/bash

echo "Проверка портов в контейнерах..."

echo "=== Frontend контейнер ==="
docker compose exec frontend netstat -tulpn | grep LISTEN

echo "=== Backend контейнер ==="
docker compose exec codeduelplatform netstat -tulpn | grep LISTEN

echo "=== Проверка соединения из Nginx ==="
docker compose exec nginx sh -c "ping -c 2 frontend"
docker compose exec nginx sh -c "ping -c 2 codeduelplatform" 