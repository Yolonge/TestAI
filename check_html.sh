#!/bin/bash

echo "Получаем HTML-содержимое главной страницы..."
curl -s http://176.109.111.167 > page.html

echo "Проверяем наличие ключевых элементов в HTML..."
echo "Поиск тегов script для загрузки Next.js:"
grep -n "<script" page.html

echo "Поиск ссылок на статические ресурсы:"
grep -n "/_next/" page.html

echo "Первые 20 строк HTML:"
head -n 20 page.html

echo "Последние 20 строк HTML:"
tail -n 20 page.html

echo "Проверяем доступность статических ресурсов..."
STATIC_URL=$(grep -o "/_next/static/[^\"]*" page.html | head -n 1)
if [ ! -z "$STATIC_URL" ]; then
  echo "Проверяем доступность: $STATIC_URL"
  curl -I "http://176.109.111.167$STATIC_URL"
else
  echo "Статические URL не найдены в HTML"
fi

echo "Проверяем логи контейнеров..."
sudo docker-compose logs --tail=20 frontend
sudo docker-compose logs --tail=20 nginx 