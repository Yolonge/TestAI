#!/bin/bash
set -e

# Создаем временный файл для модифицированного бэкапа
cat > /tmp/fixed_backup.sql << 'EOF'
-- Отключаем проверки ограничений на время импорта
SET session_replication_role = 'replica';

-- Импорт только данных (без создания таблиц)
EOF

# Извлекаем только INSERT-запросы из файла бэкапа
grep -i "^INSERT INTO" /docker-entrypoint-initdb.d/02-testai_backup.sql >> /tmp/fixed_backup.sql

# Добавляем команды для включения проверок ограничений
cat >> /tmp/fixed_backup.sql << 'EOF'

-- Включаем обратно проверки ограничений
SET session_replication_role = 'origin';
EOF

# Заменяем оригинальный файл бэкапа модифицированным
mv /tmp/fixed_backup.sql /docker-entrypoint-initdb.d/02-testai_backup.sql

# Делаем файл исполняемым
chmod +x /docker-entrypoint-initdb.d/02-testai_backup.sql 