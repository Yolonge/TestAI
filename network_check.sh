#!/bin/bash

echo "=== Информация о сети ==="
echo "Сетевые интерфейсы:"
ip addr show

echo -e "\n=== Маршруты ==="
ip route

echo -e "\n=== Проверка файрвола ==="
sudo iptables -L -n

echo -e "\n=== Активные соединения ==="
sudo netstat -tulpn

echo -e "\n=== Проверка доступности сервисов внутри контейнеров ==="
docker-compose exec frontend curl -I http://localhost:3000 || echo "Не удалось подключиться к frontend на порту 3000"
docker-compose exec nginx curl -I http://localhost:80 || echo "Не удалось подключиться к nginx на порту 80"
docker-compose exec nginx curl -I http://frontend:3000 || echo "Не удалось подключиться к frontend из nginx"

echo -e "\n=== Внешняя проверка ==="
curl -v http://localhost:80
curl -v http://176.109.111.167:80

echo -e "\n=== Проверка DNS ==="
nslookup 176.109.111.167

echo -e "\n=== Проверка открытых портов снаружи ==="
nc -zv 176.109.111.167 80
nc -zv 176.109.111.167 3000

echo -e "\n=== Информация о Docker сети ==="
docker network ls
docker network inspect $(docker network ls -q) | grep -A 10 "Name\|Gateway\|Subnet" 