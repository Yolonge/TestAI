#!/bin/bash

PUBLIC_IP="176.109.111.167"

echo "Проверка доступности сервисов через публичный IP: $PUBLIC_IP"

echo "=== Проверка статической страницы ==="
curl -v "http://$PUBLIC_IP/static-check.html"

echo -e "\n=== Проверка API ==="
curl -v "http://$PUBLIC_IP/api/health"

echo -e "\n=== Проверка фронтенда ==="
curl -v "http://$PUBLIC_IP/"

echo -e "\n=== Проверка DNS резолвинга ==="
nslookup $PUBLIC_IP

echo -e "\n=== Проверка открытых портов ==="
nc -zv $PUBLIC_IP 80
nc -zv $PUBLIC_IP 443 