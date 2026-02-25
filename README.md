# BeautyShop Backend

Backend для SaaS-проекта BeautyShop - система управления записями мастеров красоты.

## Технологический стек

- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** + **Bcrypt** для аутентификации

## Структура проекта

```
beautyShop/
├── src/
│   ├── controllers/     # Контроллеры для обработки запросов
│   ├── middleware/      # Middleware для аутентификации и валидации
│   ├── routes/         # Определение маршрутов API
│   ├── services/        # Дополнительные сервисы (если потребуется)
│   ├── types/          # TypeScript интерфейсы
│   ├── utils/          # Вспомогательные функции
│   └── index.ts        # Основной файл приложения
├── prisma/
│   ├── schema.prisma   # Схема базы данных
│   └── seed.ts        # Начальные данные для БД
├── package.json
├── tsconfig.json
└── README.md
```

## API эндпоинты

### Аутентификация
- `POST /api/auth/register` - Регистрация нового мастера
- `POST /api/auth/login` - Вход в систему

### Публичные эндпоинты
- `GET /api/public/:slug` - Получение данных мастера + услуги
- `POST /api/public/:slug/book` - Создание записи к мастеру

### Услуги (требуется аутентификация)
- `GET /api/services` - Получение всех услуг
- `POST /api/services` - Создание новой услуги
- `PUT /api/services/:id` - Обновление услуги
- `DELETE /api/services/:id` - Удаление услуги

### Записи (требуется аутентификация)
- `GET /api/appointments` - Получение всех записей
- `PUT /api/appointments/:id` - Обновление записи

### Клиенты (требуется аутентификация)
- `GET /api/clients` - Получение всех клиентов
- `POST /api/clients` - Создание нового клиента

### Расходы (требуется аутентификация)
- `POST /api/expenses` - Добавление расхода

### Статистика (требуется аутентификация)
- `GET /api/stats` - Получение статистики по доходам и расходам

## Настройка проекта

### 1. Клонирование и установка зависимостей

```bash
cd beautyShop
npm install
```

### 2. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/beautyshop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
```

### 3. Настройка базы данных

1. Установите PostgreSQL
2. Создайте базу данных `beautyshop`
3. Сгенерируйте Prisma клиент:

```bash
npm run db:generate
```

4. Запустите миграции:

```bash
npm run db:migrate
```

5. Заполните базу тестовыми данными:

```bash
npm run prisma:db seed
```

### 4. Запуск приложения

В режиме разработки:
```bash
npm run dev
```

Сборка и запуск:
```bash
npm run build
npm start
```

## Примеры использования

### Регистрация мастера

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@example.com",
    "password": "password123",
    "name": "Мастер Красоты"
  }'
```

### Вход в систему

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@example.com",
    "password": "password123"
  }'
```

### Получение данных мастера

```bash
curl http://localhost:3000/api/public/krasota-master
```

### Создание записи

```bash
curl -X POST http://localhost:3000/api/public/krasota-master/book \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Мария Петрова",
    "clientPhone": "+79991234567",
    "startTime": "2024-03-25T10:00:00.000Z",
    "endTime": "2024-03-25T11:00:00.000Z",
    "serviceId": "uuid-сервиса"
  }'
```

## Тестирование

Проект готов к добавлению тестов с использованием Jest и Supertest.

## Лицензия

MIT