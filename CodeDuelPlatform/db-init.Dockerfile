FROM postgres:15-alpine

# Копирование файлов SQL и скрипта инициализации
COPY CodeDuelPlatform/migrations.sql /docker-entrypoint-initdb.d/
COPY CodeDuelPlatform/testai_backup.sql /docker-entrypoint-initdb.d/
COPY CodeDuelPlatform/init-db.sh /docker-entrypoint-initdb.d/

# Установка прав на выполнение скрипта
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh 