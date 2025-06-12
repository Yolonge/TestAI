#!/bin/bash

echo "Останавливаем и удаляем все контейнеры и сети..."
sudo docker-compose down -v

echo "Удаляем все образы, связанные с проектом..."
sudo docker rmi -f $(sudo docker images -q)

echo "Проверяем и настраиваем файрвол..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw status

echo "Собираем и запускаем контейнеры заново..."
sudo docker-compose up -d --build

echo "Ожидаем запуска контейнеров..."
sleep 30

echo "Проверяем статус контейнеров..."
sudo docker-compose ps

echo "Проверяем доступность сервисов..."
curl -I http://localhost:80
curl -I http://176.109.111.167

echo "Проверяем содержимое HTML..."
chmod +x check_html.sh
./check_html.sh

echo "Рестарт завершен. Приложение должно быть доступно по адресу http://176.109.111.167" 