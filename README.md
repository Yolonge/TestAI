# CodeDuel Platform

Платформа для проведения дуэлей по программированию между разработчиками.

## Структура проекта

- `CodeDuelPlatform/` - Бэкенд на ASP.NET Core
- `frontend-react/` - Фронтенд на React
- `frontend/` - Альтернативный фронтенд на чистом JavaScript

## Особенности

- Матчмейкинг на основе Redis для быстрого поиска оппонентов
- Кеширование активных дуэлей для снижения нагрузки на базу данных
- Фоновая служба для подбора оппонентов
- Real-time взаимодействие через SignalR

## Запуск в Docker

1. Установите Docker и Docker Compose
2. Клонируйте репозиторий
3. Соберите и запустите приложение:

```bash
# Сначала соберите образы
docker-compose build

# Затем запустите контейнеры
docker-compose up -d
```

Это запустит:
- Бэкенд ASP.NET Core на порту 8080
- PostgreSQL на порту 5432
- Redis на порту 6379

### Решение проблем

Если вы видите ошибку "pull access denied for codeduelplatform, repository does not exist", выполните следующие шаги:

```bash
# Остановите все контейнеры
docker-compose down

# Соберите образы локально
docker-compose build

# Запустите контейнеры после локальной сборки
docker-compose up -d
```

## Локальная разработка

### Требования

- .NET SDK 8.0
- Node.js 18+ (для React фронтенда)
- PostgreSQL
- Redis

### Запуск бэкенда

```bash
cd CodeDuelPlatform
dotnet run
```

### Запуск React фронтенда

```bash
cd frontend-react
npm install
npm run dev
```

## API Документация

REST API доступно по адресу: http://localhost:8080/swagger

SignalR Hub: http://localhost:8080/hubs/duel

## Деплой на продакшн-сервер

Для деплоя на сервер с внешним IP (176.109.111.167) выполните следующие шаги:

1. Склонируйте репозиторий на сервер
2. Убедитесь, что на сервере установлены Docker и Docker Compose
3. Выполните скрипт деплоя:

```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт выполнит следующие действия:
- Остановит и удалит старые контейнеры
- Соберет новые образы
- Запустит приложение с использованием production-конфигурации

После успешного деплоя ваше приложение будет доступно по адресу:
- Фронтенд: http://176.109.111.167
- Бэкенд API: http://176.109.111.167/api
- Swagger UI: http://176.109.111.167/swagger
- SignalR Hub: http://176.109.111.167/hubs/duel 