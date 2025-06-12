#!/bin/bash

# Проверка и настройка файрвола

# Проверяем наличие UFW
if command -v ufw &> /dev/null; then
    echo "UFW установлен, проверяем настройки..."
    
    # Разрешаем SSH для безопасности
    sudo ufw allow 22/tcp
    
    # Разрешаем HTTP и HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Проверяем статус UFW
    sudo ufw status
    
    # Если UFW отключен, включаем его
    if sudo ufw status | grep -q "inactive"; then
        echo "UFW неактивен, включаем..."
        sudo ufw --force enable
    fi
else
    echo "UFW не установлен, проверяем наличие других файрволов..."
    
    # Проверяем iptables
    if command -v iptables &> /dev/null; then
        echo "Используется iptables, добавляем правила..."
        
        # Разрешаем входящий трафик на порт 80
        sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
        
        # Разрешаем входящий трафик на порт 443
        sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
        
        # Сохраняем правила
        if command -v iptables-save &> /dev/null; then
            sudo iptables-save > /etc/iptables/rules.v4 || sudo iptables-save | sudo tee /etc/iptables.rules
        fi
    fi
fi

# Проверяем доступность портов
echo "Проверяем прослушиваемые порты:"
sudo netstat -tulpn | grep -E ":(80|443)"

# Проверяем состояние служб
echo "Проверяем состояние Docker:"
sudo systemctl status docker --no-pager

# Проверяем контейнеры
echo "Проверяем запущенные контейнеры:"
sudo docker ps 