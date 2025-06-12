#!/bin/bash

echo "Установка прав на исполнение для скриптов..."

chmod +x deploy.sh
chmod +x check-ports.sh
chmod +x check-public.sh
chmod +x check-system.sh
chmod +x migrate-db.sh

echo "Готово!" 