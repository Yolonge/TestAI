# Инструкция по деплою приложения

## Подготовка к деплою

1. Убедитесь, что у вас есть доступ к виртуальной машине по SSH:
   ```
   ssh username@176.109.111.167
   ```

2. Подготовьте ВМ к деплою, установив необходимые зависимости:
   ```
   sudo apt update
   sudo apt upgrade -y
   sudo apt install -y docker.io
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo apt install -y docker-compose
   ```

## Метод 1: Загрузка файлов на сервер

1. Создайте каталог для проекта на сервере:
   ```
   mkdir -p /app
   ```

2. Загрузите все файлы проекта на сервер:
   ```
   scp -r * username@176.109.111.167:/app/
   ```

3. Подключитесь к серверу и перейдите в каталог проекта:
   ```
   ssh username@176.109.111.167
   cd /app
   ```

4. Запустите приложение:
   ```
   sudo docker-compose up -d
   ```

5. Примените миграции базы данных (если необходимо):
   ```
   sudo docker-compose exec codeduelplatform dotnet ef database update
   ```

## Метод 2: Использование скрипта деплоя

1. Загрузите скрипт deploy.sh на сервер:
   ```
   scp deploy.sh username@176.109.111.167:~/
   ```

2. Подключитесь к серверу и сделайте скрипт исполняемым:
   ```
   ssh username@176.109.111.167
   chmod +x deploy.sh
   ```

3. Запустите скрипт деплоя:
   ```
   ./deploy.sh
   ```

## Проверка деплоя

После завершения деплоя приложение будет доступно по адресу:
```
http://176.109.111.167
```

## Решение проблем

### Проверка логов контейнеров:
```
sudo docker-compose logs -f
```

### Перезапуск контейнеров:
```
sudo docker-compose restart
```

### Остановка и удаление контейнеров:
```
sudo docker-compose down
```

### Полная переустановка:
```
sudo docker-compose down
sudo docker-compose up -d --build
``` 