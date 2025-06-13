#!/bin/bash
set -e

# Ожидание готовности PostgreSQL
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "PostgreSQL недоступен - ожидание..."
  sleep 1
done

echo "PostgreSQL готов к работе - применяю миграции"

# Применение миграций
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/migrations.sql

echo "Миграции применены - восстанавливаю данные из бэкапа"

# Восстановление данных из бэкапа
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/testai_backup.sql

echo "Данные успешно восстановлены" 