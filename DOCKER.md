# Docker Setup для BeautyShop

Этот документ описывает如何 использовать Docker для запуска BeautyShop проекта.

## Требования

- Docker Engine 20.10+
- Docker Compose 2.0+

## ⚠️ Важно: Порты

**Изменённые порты для избежания конфликтов:**
- PostgreSQL: **5434** (вместо стандартного 5432)
- Frontend: **8081** (вместо стандартного 80, чтобы не конфликтовать с telegram-claude-bot)

Если порты заняты, отредактируйте `docker-compose.yml`:
```yaml
services:
  postgres:
    ports:
      - "5434:5432"  # Изменить 5434 на свободный порт
  frontend:
    ports:
      - "8080:80"     # Изменить 8080 на свободный порт
```

## Структура

```
beautyShop/
├── Dockerfile              # Production backend image
├── Dockerfile.dev          # Development backend image
├── .dockerignore           # Files to exclude from build
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── Makefile                # Convenient commands
└── frontend/
    ├── Dockerfile          # Production frontend image
    ├── Dockerfile.dev      # Development frontend image
    └── .dockerignore       # Files to exclude from frontend build
```

## Быстрый старт

### Продакшн режим

```bash
# 1. Скопировать и настроить .env
cp .env.docker.example .env
# Отредактируйте .env - измените пароли!

# 2. Сборка и запуск
make build
make up

# Или одной командой
docker-compose up -d --build
```

### Доступ к сервисам

После запуска сервисы будут доступны:
- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5434 (снаружи), postgres:5432 (внутри Docker)

### Продакшн режим

```bash
# Сборка и запуск
make build
make up

# Или одной командой
docker-compose up -d --build
```

### Режим разработки

```bash
# Сборка и запуск с hot-reload
make dev

# Или
docker-compose -f docker-compose.dev.yml up -d --build
```

## Make команды

| Команда | Описание |
|---------|----------|
| `make help` | Показать все доступные команды |
| `make build` | Собрать production образы |
| `make build-dev` | Собрать development образы |
| `make up` | Запустить в production режиме |
| `make dev` | Запустить в development режиме |
| `make down` | Остановить все сервисы |
| `make logs` | Показать логи всех сервисов |
| `make logs-backend` | Показать логи backend |
| `make shell-backend` | Открыть shell в backend контейнере |
| `make migrate-db` | Запустить миграции БД |
| `make seed-db` | Наполнить БД тестовыми данными |
| `make test` | Запустить тесты |
| `make clean` | Удалить все контейнеры и volume'ы |

## Конфигурация

### Переменные окружения

**Вариант 1: Использовать готовый шаблон**

```bash
cp .env.docker.example .env
# Отредактировать .env и изменить пароли!
```

**Вариант 2: Создать вручную**

Создайте файл `.env` в корне проекта:

```env
# Database (для Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=beautyshop

# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
PORT=3000

# Внутри Docker сеть обращается к postgres:5432
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/beautyshop

# Frontend (опционально)
VITE_API_URL=http://localhost:8080
```

⚠️ **Важно:** Измените пароли и секреты в продакшене!

## Сервисы

### 1. PostgreSQL (postgres)

- **Порт:** 5434 (хост) → 5432 (контейнер)
- **Image:** postgres:15-alpine
- **Volume:** postgres_data (персистентность данных)
- **Health check:** pg_isready каждые 10s

### 2. Backend (backend)

- **Порт:** 3000 (хост) → 3000 (контейнер)
- **Build:** Multi-stage (Node.js 20 Alpine)
- **Health check:** GET /health каждые 30s
- **Зависимости:** postgres (health check)

### 3. Frontend (frontend)

- **Порт:** 8081 (production), 5174 (development)
- **Примечание:** Порт изменен с 8080 на 8081 для избежания конфликта с telegram-claude-bot
- **Build:** Multi-stage (Nginx Alpine для production)
- **Health check:** wget localhost каждые 30s
- **Зависимости:** backend (health check)

## Особенности сборки

### Backend Production

1. **Builder stage:**
   - Установка всех зависимостей
   - Генерация Prisma Client ВНУТРИ контейнера сборки
   - Компиляция TypeScript
   - Оптимизация образов

2. **Production stage:**
   - **Debian-based образ (node:20-slim) вместо Alpine**
   - Только production зависимости
   - Non-root пользователь (nodejs:1001)
   - dumb-init для корректной обработки сигналов
   - Health check на /health endpoint

> **Важно:** Используется `node:20-slim` вместо Alpine для решения проблемы с OpenSSL.
> Это предотвращает ошибку: `libssl.so.1.1: version OPENSSL_1_1_0 not found`
> Prisma Client генерируется в builder stage и гарантированно работает в runner stage.

### Frontend Production

1. **Builder stage:**
   - Установка зависимостей
   - Сборка Vite (оптимизированный production build)

2. **Production stage:**
   - nginx:alpine
   - Custom nginx config:
     - Gzip сжатие
     - Proxy /api/* к backend
     - SPA routing (React Router)
     - Кеширование статики
     - Security headers
   - Отдельный health check

## Разработка

### Hot-reload

В режиме разработки оба контейнера (backend и frontend) поддерживают hot-reload:

- **Backend:** ts-node-dev следит за изменениями .ts файлов
- **Frontend:** Vite HMR (Hot Module Replacement)

### Volume mounts

```yaml
backend:
  volumes:
    - ./src:/app/src              # Hot-reload для исходников
    - ./prisma:/app/prisma        # Доступ к схеме БД
    - /app/node_modules           # Изолированные node_modules

frontend:
  volumes:
    - ./frontend/src:/app/src     # Hot-reload для React компонентов
    - /app/node_modules           # Изолированные node_modules
```

## Работа с базой данных

### Миграции

```bash
# Применить миграции
make migrate-db

# Или вручную
docker-compose exec backend npx prisma migrate deploy
```

### Seed данные

```bash
# Наполнить БД тестовыми данными
make seed-db

# Или вручную
docker-compose exec backend npx prisma db seed
```

### Прямой доступ к PostgreSQL

```bash
# PostgreSQL shell
make shell-db

# Или
docker-compose exec postgres psql -U postgres -d beautyshop
```

## Логи и мониторинг

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Статус контейнеров

```bash
# Production
make ps

# Development
make ps-dev
```

### Health checks

Все сервисы имеют health checks:

```bash
# Проверить статус health checks
docker inspect --format='{{.State.Health.Status}}' beautyshop-backend
docker inspect --format='{{.State.Health.Status}}' beautyshop-frontend
docker inspect --format='{{.State.Health.Status}}' beautyshop-db
```

## Production рекомендации

### 1. Безопасность

- ✅ Используйте сильные пароли в `.env`
- ✅ Измените `JWT_SECRET` на уникальное значение
- ✅ Не храните `.env` в git
- ✅ Используйте non-root пользователей (уже настроено)

### 2. Персистентность данных

- ✅ Volume `postgres_data` для БД
- ✅ Резервные копии: `docker exec postgres pg_dump ...`

### 3. Мониторинг

```bash
# Ресурсы контейнеров
docker stats

# Логи с метками времени
docker-compose logs --timestamps
```

### 4. Обновление

```bash
# Пересобрать образы
docker-compose build --no-cache

# Перезапустить с новым кодом
docker-compose up -d
```

## Troubleshooting

### Порты уже заняты

Если при запуске возникает ошибка "port is already allocated":

```bash
# 1. Найти какой процесс занимает порт
sudo lsof -i :8080   # или другой порт
sudo lsof -i :5434
sudo lsof -i :3000

# 2. Изменить порт в docker-compose.yml:
#    postgres:
#      ports:
#        - "5435:5432"  # изменить 5434 на 5435
#    frontend:
#      ports:
#        - "8081:80"    # изменить 8080 на 8081
#    backend:
#      ports:
#        - "3001:3000"  # изменить 3000 на 3001
```

### Контейнеры не стартуют

```bash
# Проверить логи
docker-compose logs

# Проверить статус
docker-compose ps

# Пересобрать
make clean
make build
make up
```

### Проблемы с БД

```bash
# Сбросить БД (WARNING: все данные будут удалены)
make clean
docker volume rm beautyshop_postgres_data
make up
make migrate-db
make seed-db
```

### Backend не может подключиться к БД

Проверьте:
1. ✅ PostgreSQL запущен: `docker-compose ps`
2. ✅ Health check прошёл: `docker inspect beautyshop-db`
3. ✅ Правильный `DATABASE_URL` в `.env`

### Frontend не видит backend

Проверьте nginx proxy конфиг:
- ✅ Backend запущен на порту 3000
- ✅ Health check backend прошёл
- ✅ Frontend в сети `beautyshop-network`

## Полная очистка

```bash
# Остановить и удалить все контейнеры, volumes, images
make clean

# Или вручную
docker-compose down -v --rmi all
docker system prune -a
```

## Полезные команды

### Размеры образов

```bash
docker images | grep beautyshop
```

### Использование диска

```bash
docker system df
```

### Вход в работающий контейнер

```bash
# Backend shell
make shell-backend

# Или с bash
docker-compose exec backend bash
```

### Экспорт/импорт БД

```bash
# Экспорт
docker-compose exec postgres pg_dump -U postgres beautyshop > backup.sql

# Импорт
cat backup.sql | docker-compose exec -T postgres psql -U postgres beautyshop
```

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose build

      - name: Run tests
        run: docker-compose exec backend npm test

      - name: Push to registry
        run: |
          docker tag beautyshop-backend registry.example.com/beautyshop-backend:${{ github.sha }}
          docker push registry.example.com/beautyshop-backend:${{ github.sha }}
```

---

## Полезные ссылки

- [Docker Compose docs](https://docs.docker.com/compose/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx configuration](https://nginx.org/en/docs/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/docker)
