#!/bin/bash

# Проверка и установка UFW, если его нет
if ! command -v ufw &> /dev/null; then
    echo "UFW не установлен. Устанавливаю..."
    sudo apt update
    sudo apt install -y ufw
fi

# Проверка статуса UFW
sudo ufw status

# Разрешение необходимых портов
echo "Открываю необходимые порты..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Если UFW не активен, активируем его
if sudo ufw status | grep -q "inactive"; then
    echo "Активирую UFW..."
    sudo ufw --force enable
fi

# Проверка финального статуса
echo "Финальный статус UFW:"
sudo ufw status

# Проверка открытых портов с помощью netstat
echo "Проверка открытых портов:"
if command -v netstat &> /dev/null; then
    netstat -tulpn | grep -E ':(22|80|443)'
else
    echo "netstat не установлен. Устанавливаю..."
    sudo apt install -y net-tools
    netstat -tulpn | grep -E ':(22|80|443)'
fi 