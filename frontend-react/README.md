# Фронтенд для платформы дуэлей по программированию

Это фронтенд-приложение для платформы дуэлей по программированию, разработанное с использованием React и Next.js.

## Функциональность

- Аутентификация пользователей (вход и регистрация)
- Поиск случайного оппонента для дуэли
- Процесс дуэли с таймером для ответов на вопросы
- Просмотр результатов дуэли и правильных ответов
- История дуэлей пользователя
- Рейтинг пользователей по победам и рейтингу
- Профиль пользователя с его статистикой

## Технологии

- React 18
- Next.js 15
- TypeScript
- Tailwind CSS для стилизации
- Axios для HTTP запросов
- SignalR для коммуникации в реальном времени

## Предварительные требования

- Node.js 18+ и npm
- Запущенный бэкенд-сервер (ASP.NET Core)

## Установка и запуск

1. Клонируйте репозиторий
2. Установите зависимости:
   ```
   npm install
   ```
3. Настройте URL бэкенда в `next.config.js` (при необходимости)
4. Запустите приложение в режиме разработки:
   ```
   npm run dev
   ```
5. Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере

## Структура проекта

- `src/app` - Страницы приложения (Next.js App Router)
- `src/components` - Повторно используемые компоненты UI
- `src/contexts` - React контексты для управления состоянием
- `src/services` - Сервисы для работы с API и SignalR
- `src/utils` - Вспомогательные функции

## Сборка для продакшена

Для сборки проекта для продакшена выполните:

```
npm run build
```

Для запуска продакшен-версии выполните:

```
npm run start
```

## Интеграция с бэкендом

Фронтенд взаимодействует с бэкендом через:

1. REST API для стандартных операций (авторизация, получение данных)
2. SignalR для коммуникации в реальном времени (поиск оппонента, процесс дуэли)

Убедитесь, что бэкенд запущен и доступен по URL, указанному в `next.config.js`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

   ```
   npm run dev
   ```
5. Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере

## Структура проекта

- `src/app` - Страницы приложения (Next.js App Router)
- `src/components` - Повторно используемые компоненты UI
- `src/contexts` - React контексты для управления состоянием
- `src/services` - Сервисы для работы с API и SignalR
- `src/utils` - Вспомогательные функции

## Сборка для продакшена

Для сборки проекта для продакшена выполните:

```
npm run build
```

Для запуска продакшен-версии выполните:

```
npm run start
```

## Интеграция с бэкендом

Фронтенд взаимодействует с бэкендом через:

1. REST API для стандартных операций (авторизация, получение данных)
2. SignalR для коммуникации в реальном времени (поиск оппонента, процесс дуэли)

Убедитесь, что бэкенд запущен и доступен по URL, указанному в `next.config.js`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.