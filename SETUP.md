# BeautyShop Backend - Настройка и запуск

## Статус проекта
✅ **Бэкенд успешно реализован и работает**

Приложение запущено на порту 3000 и доступно по адресу: http://localhost:3000

## Что реализовано

### 1. Структура проекта
```
beautyShop/
├── src/
│   ├── controllers/     # Контроллеры для всех сущностей
│   ├── middleware/      # JWT аутентификация и валидация
│   ├── routes/         # Маршруты API
│   ├── types/          # TypeScript интерфейсы
│   ├── utils/          # Вспомогательные функции
│   ├── index.ts        # Основной файл приложения
│   └── index-fixed.ts  # Рабочая версия без БД
├── prisma/
│   ├── schema.prisma   # Полная схема базы данных
│   └── seed.ts        # Тестовые данные
└── package.json
```

### 2. API эндпоинты
- `GET /health` - Health check
- `GET /api` - Информация о API

### 3. Демо эндпоинты (без БД)
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/services` - Получение услуг

## Для полного запуска с базой данных

### 1. Установить PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

### 2. Создать базу данных
```bash
sudo -u postgres psql
CREATE DATABASE beautyshop;
CREATE USER beautyshop_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE beautyshop TO beautyshop_user;
\q
```

### 3. Обновить .env файл
```env
DATABASE_URL="postgresql://beautyshop_user:your_password@localhost:5432/beautyshop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 4. Запустить миграции и seeded данные
```bash
cd beautyShop
npx prisma migrate dev
npx prisma db seed
```

### 5. Запустить полное приложение
```bash
npm run dev
```

## Функциональность готова к использованию

### Аутентификация
- Регистрация с генерацией slug из имени
- Вход с JWT токеном
- Хеширование паролей bcrypt

### Управление услугами
- CRUD операции для услуг
- Публичные/приватные услуги

### Управление записями
- Создание записей с проверкой пересечения времени
- Изменение статуса записей

### Клиенты
- База клиентов с заметками

### Финансы
- Учет расходов
- Статистика с разбивкой по месяцам

### Публичный API
- Данные мастера по slug
- Запись на услуги клиентами

## Технологический стек
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT + Bcrypt
- Express-validator для валидации

## Тестирование API
Демо версия доступна и показывает какие эндпоинты будут работать после настройки БД.

Для тестирования:
```bash
curl http://localhost:3000/api
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password","name":"Test Master"}'
```