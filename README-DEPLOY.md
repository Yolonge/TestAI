# Инструкции по деплою CodeDuel

## Подготовка к деплою

1. Убедитесь, что на сервере установлен Docker и Docker Compose.
2. Скопируйте все файлы проекта на сервер.
3. Сделайте скрипты исполняемыми:
   ```bash
   chmod +x make-executable.sh
   ./make-executable.sh
   ```

## Деплой приложения

1. Запустите скрипт деплоя:
   ```bash
   ./deploy.sh
   ```

2. После успешного деплоя приложение будет доступно по адресу: http://176.109.111.167

## Проверка работоспособности

1. Проверьте доступность статической страницы: http://176.109.111.167/static-check.html
2. Если статическая страница доступна, но основной сайт нет, выполните диагностику:
   ```bash
   ./check-system.sh
   ```

3. Для проверки портов в контейнерах:
   ```bash
   ./check-ports.sh
   ```

4. Для проверки доступности через публичный IP:
   ```bash
   ./check-public.sh
   ```

## Устранение проблем

### Если фронтенд не запускается:

1. Проверьте логи контейнера:
   ```bash
   docker compose logs frontend
   ```

2. Перезапустите контейнер:
   ```bash
   docker compose restart frontend
   ```

3. Проверьте, что контейнер слушает порт 3000:
   ```bash
   docker compose exec frontend netstat -tulpn | grep LISTEN
   ```

### Если бэкенд не запускается:

1. Проверьте логи контейнера:
   ```bash
   docker compose logs codeduelplatform
   ```

2. Перезапустите контейнер:
   ```bash
   docker compose restart codeduelplatform
   ```

3. Проверьте, что контейнер слушает порт 80:
   ```bash
   docker compose exec codeduelplatform netstat -tulpn | grep LISTEN
   ```

### Если Nginx не проксирует запросы:

1. Проверьте логи Nginx:
   ```bash
   docker compose logs nginx
   ```

2. Проверьте доступность сервисов из контейнера Nginx:
   ```bash
   docker compose exec nginx sh -c "curl -v http://frontend:3000/"
   docker compose exec nginx sh -c "curl -v http://codeduelplatform:80/api/health"
   ```

## Полная переустановка

Если ничего не помогает, выполните полную переустановку:

```bash
docker compose down -v  # Удаляет контейнеры и тома
docker system prune -a  # Удаляет все неиспользуемые образы, контейнеры и тома
./deploy.sh  # Запускает деплой заново
```

## Просмотр логов

Для просмотра логов контейнеров используйте команду:
```bash
docker compose logs -f
```

Для просмотра логов конкретного сервиса:
```bash
docker compose logs -f frontend
docker compose logs -f codeduelplatform
docker compose logs -f nginx
```

## Перезапуск приложения

Если вам нужно перезапустить приложение:
```bash
docker compose restart
```

## Остановка приложения

Для остановки приложения:
```bash
docker compose down
``` 