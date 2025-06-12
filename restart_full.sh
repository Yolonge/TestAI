#!/bin/bash

echo "Останавливаем и удаляем все контейнеры и сети..."
sudo docker-compose down -v

echo "Удаляем все образы, связанные с проектом..."
sudo docker rmi -f $(sudo docker images -q codeduelplatform frontend-react nginx)

echo "Проверяем и настраиваем файрвол..."
bash check_firewall.sh

echo "Собираем и запускаем контейнеры заново..."
sudo docker-compose up -d --build

echo "Ожидаем запуска контейнеров..."
sleep 20

echo "Проверяем статус контейнеров..."
sudo docker-compose ps

echo "Проверяем информацию о сети Docker..."
sudo docker network inspect $(sudo docker network ls -q --filter name=testai) | grep -A 20 "Containers"

echo "Выполняем проверку сети..."
chmod +x network_check.sh
./network_check.sh

echo "Проверяем логи контейнеров..."
sudo docker-compose logs nginx
sudo docker-compose logs frontend

echo "Проверка через CURL с заголовком Host:"
curl -I -H "Host: 176.109.111.167" http://176.109.111.167

echo "Рестарт завершен. Приложение должно быть доступно по адресу http://176.109.111.167" 