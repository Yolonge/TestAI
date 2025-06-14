#!/bin/bash
set -e

# Ждем, пока PostgreSQL будет доступен
until PGPASSWORD=5959 psql -h postgres -U postgres -d testai -c '\q'; do
  >&2 echo "PostgreSQL недоступен - ждем..."
  sleep 5
done

>&2 echo "PostgreSQL запущен - выполняем миграции..."

# Устанавливаем переменные среды для EF Core
export ConnectionStrings__DefaultConnection="User ID=postgres;Password=5959;Host=postgres;Port=5432;Database=testai;"

# Выполняем миграции
dotnet ef database update --no-build

# Запускаем приложение
exec dotnet CodeDuelPlatform.dll 