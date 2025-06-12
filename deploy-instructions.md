# Инструкция по деплою CodeDuel Platform на виртуальной машине

## Предварительные требования

На виртуальной машине должны быть установлены:
- Docker
- Docker Compose

## Шаги по деплою

1. Клонируйте репозиторий на виртуальной машине:
   ```bash
   git clone <URL-вашего-репозитория> 
   cd <название-каталога-репозитория>
   ```

2. Убедитесь, что в файле `compose.yaml` указан правильный IP-адрес вашей виртуальной машины:
   В настройках окружения для frontend сервиса должно быть:
   ```yaml
   BACKEND_URL=http://176.109.111.167:8080
   ```

3. Сгенерируйте надежный ключ для JWT и обновите его в `compose.yaml`:
   ```yaml
   Jwt__Key=your_super_secure_key_replace_in_production_minimum_16_chars
   ```
   Замените значение на случайную строку длиной не менее 16 символов.

4. Соберите и запустите контейнеры с помощью Docker Compose:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

5. Примените миграции базы данных:
   ```bash
   docker-compose exec codeduelplatform dotnet ef database update
   ```
   
   Альтернативно, если предыдущая команда не сработает:
   ```bash
   docker-compose exec codeduelplatform sh -c "cd /app && dotnet ef database update"
   ```

6. Проверьте запущенные контейнеры:
   ```bash
   docker-compose ps
   ```

7. Проверьте логи для выявления возможных ошибок:
   ```bash
   docker-compose logs
   ```

## Доступ к приложению

После успешного деплоя приложение будет доступно по следующим URL:

- Frontend: http://176.109.111.167:3000
- Backend API: http://176.109.111.167:8080
- Swagger документация: http://176.109.111.167:8080/swagger

## Решение проблем

1. Если возникают проблемы с сетевым подключением между контейнерами:
   ```bash
   docker network inspect $(docker network ls -q)
   ```

2. Для просмотра логов конкретного сервиса:
   ```bash
   docker-compose logs -f <имя-сервиса>  # например: docker-compose logs -f frontend
   ```

3. Если возникли проблемы с доступом к бэкенду с фронтенда, проверьте настройки CORS в файле `Program.cs` и убедитесь, что IP-адрес виртуальной машины добавлен в список разрешенных источников.

4. Если необходимо перезапустить сервис:
   ```bash
   docker-compose restart <имя-сервиса>
   ```

5. Для остановки всего стека и удаления контейнеров:
   ```bash
   docker-compose down
   ```
   
   Для удаления также томов (данных):
   ```bash
   docker-compose down -v  # будьте осторожны, это удалит все данные
   ``` 