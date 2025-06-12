#!/bin/bash

echo "Останавливаем контейнеры..."
sudo docker-compose down

echo "Проверяем и настраиваем файрвол..."
bash check_firewall.sh

echo "Пересобираем и запускаем контейнеры..."
sudo docker-compose up -d --build

echo "Ожидаем запуска контейнеров..."
sleep 10

echo "Проверяем статус контейнеров..."
sudo docker-compose ps

echo "Проверяем логи nginx..."
sudo docker-compose logs nginx

echo "Проверяем логи frontend..."
sudo docker-compose logs frontend

echo "Проверяем доступность сервиса извне..."
curl -I http://localhost:80

echo "Для проверки с внешнего IP используйте:"
echo "curl -I http://176.109.111.167"

echo "Рестарт завершен. Приложение должно быть доступно по адресу http://176.109.111.167" 