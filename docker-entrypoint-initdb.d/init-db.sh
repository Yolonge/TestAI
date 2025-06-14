#!/bin/bash
set -e

# Функция для проверки существования таблиц
check_tables_exist() {
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = '__EFMigrationsHistory'
    );" | grep -q t
}

# Проверяем, существуют ли уже таблицы
if ! check_tables_exist; then
  echo "База данных пустая. Загружаем данные из бэкапа..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/testai_backup.sql
  echo "Данные успешно загружены."
else
  echo "База данных уже содержит таблицы. Пропускаем загрузку данных."
fi 