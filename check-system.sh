#!/bin/bash

echo "=== Проверка статуса контейнеров ==="
docker compose ps

echo -e "\n=== Проверка сети Docker ==="
docker network inspect testai_default

echo -e "\n=== Проверка логов Nginx ==="
docker compose logs --tail=20 nginx

echo -e "\n=== Проверка логов Frontend ==="
docker compose logs --tail=20 frontend

echo -e "\n=== Проверка логов Backend ==="
docker compose logs --tail=20 codeduelplatform

echo -e "\n=== Проверка доступности сервисов внутри сети Docker ==="
docker compose exec nginx sh -c "curl -s http://frontend:3000/ || echo 'Frontend недоступен'"
docker compose exec nginx sh -c "curl -s http://codeduelplatform:80/api/health || echo 'Backend недоступен'"

echo -e "\n=== Проверка DNS резолвинга внутри сети Docker ==="
docker compose exec nginx sh -c "nslookup frontend"
docker compose exec nginx sh -c "nslookup codeduelplatform"

echo -e "\n=== Проверка доступности сервисов извне ==="
curl -s http://localhost/static-check.html > /dev/null && echo "✅ Статическая страница доступна" || echo "❌ Статическая страница недоступна"
curl -s http://localhost/ > /dev/null && echo "✅ Frontend доступен" || echo "❌ Frontend недоступен"
curl -s http://localhost/api/health > /dev/null && echo "✅ Backend API доступен" || echo "❌ Backend API недоступен"

echo -e "\n=== Проверка открытых портов в контейнерах ==="
echo "Frontend:"
docker compose exec frontend sh -c "netstat -tulpn | grep LISTEN"
echo "Backend:"
docker compose exec codeduelplatform sh -c "netstat -tulpn | grep LISTEN"
echo "Nginx:"
docker compose exec nginx sh -c "netstat -tulpn | grep LISTEN" 