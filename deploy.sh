#!/bin/bash

# Обновление пакетов
sudo apt update
sudo apt upgrade -y

# Установка Docker и Docker Compose
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo apt install -y docker-compose

# Установка утилит для диагностики
sudo apt install -y net-tools curl

# Создание каталога для проекта
mkdir -p /app
cd /app

# Клонирование репозитория (замените на свой репозиторий)
# git clone https://github.com/your-username/your-repo.git .

# Копирование файлов (если вы загружаете их вручально)
# scp -r * username@176.109.111.167:/app/

# Проверяем настройки файрвола
if command -v ufw &> /dev/null; then
    echo "Настраиваем UFW..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Включаем UFW если он не активен
    if sudo ufw status | grep -q "inactive"; then
        sudo ufw --force enable
    fi
else
    echo "Настраиваем iptables..."
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
fi

# Остановка и удаление существующих контейнеров
sudo docker-compose down

# Перестройка образов
sudo docker-compose build --no-cache

# Запуск контейнеров
sudo docker-compose up -d

# Ожидание запуска контейнеров
echo "Ожидаем запуска контейнеров..."
sleep 15

# Применение миграций
echo "Применяем миграции базы данных..."
sudo docker-compose exec codeduelplatform dotnet ef database update

# Перезапуск после применения миграций
echo "Перезапускаем контейнеры..."
sudo docker-compose restart

# Проверка статуса
echo "Проверяем статус контейнеров..."
sudo docker-compose ps

echo "Проверяем доступность по сети..."
curl -I http://localhost:80

echo "Деплой завершен. Приложение доступно по адресу http://176.109.111.167" 