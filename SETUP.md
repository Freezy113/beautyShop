# BeautyShop - Настройка и запуск

## Требования

- Node.js 18+ (рекомендуется 20+)
- PostgreSQL 15+
- npm

Или:
- Docker Engine 20.10+
- Docker Compose 2.0+

---

## Вариант 1: Docker (рекомендуется)

```bash
# 1. Скопировать .env
cp .env.docker.example .env
# Отредактировать пароли и JWT_SECRET!

# 2. Сборка и запуск
docker-compose up -d --build

# 3. Миграции и seed данные
make migrate-db
make seed-db
```

**Доступ:**
- Frontend: http://localhost:8081
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5434

Подробнее: [DOCKER.md](./DOCKER.md)

---

## Вариант 2: Локальный запуск

### 1. Установка зависимостей

```bash
cd beautyShop
npm install
cd frontend && npm install && cd ..
```

### 2. Настройка окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/beautyshop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
```

### 3. Настройка базы данных

```bash
# Создать базу данных
sudo -u postgres psql
CREATE DATABASE beautyshop;
\q

# Генерация Prisma клиента
npx prisma generate

# Миграции
npx prisma migrate dev

# Тестовые данные (опционально)
npx prisma db seed
```

### 4. Запуск

**Backend** (терминал 1):
```bash
npm run dev
```

**Frontend** (терминал 2):
```bash
cd frontend
npm run dev
```

**Доступ:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## Сборка для production

```bash
# Backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Результат в frontend/dist/
```

---

## Демо-данные

После seed:
- **Email:** test@example.com
- **Password:** password123
- **Публичная страница:** http://localhost:5173/book/test-master

---

## Полезные команды

```bash
npx prisma studio     # GUI для базы данных
npx prisma migrate dev # Новая миграция
npm test               # Запуск тестов
npm run test:coverage  # Тесты с покрытием
```
