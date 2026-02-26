# BeautyShop

SaaS-платформа для бьюти-мастеров: онлайн-запись клиентов, управление услугами, CRM и финансовая аналитика.

## Технологический стек

**Backend:** Node.js + Express + TypeScript, Prisma ORM + PostgreSQL, JWT + Bcrypt
**Frontend:** React 19 + Vite 5 + TypeScript, Tailwind CSS 3, React Router 6, Axios
**Инфраструктура:** Docker + docker-compose, Nginx (production frontend)

## Структура проекта

```
beautyShop/
├── src/                        # Backend (Express)
│   ├── controllers/            # Контроллеры (7 файлов)
│   ├── routes/                 # API маршруты (7 файлов)
│   ├── middleware/             # Auth, validation
│   ├── utils/                  # JWT, bcrypt, slug, time check
│   ├── types/                  # TypeScript интерфейсы
│   └── index.ts                # Entry point
│
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # UI компоненты (Navigation, common/)
│   │   ├── pages/              # Страницы (auth, dashboard, public)
│   │   ├── hooks/              # useAuth, useProtectedRoute
│   │   ├── services/           # API client (Axios)
│   │   ├── types/              # TypeScript типы
│   │   └── utils/              # Валидация
│   ├── Dockerfile              # Production (nginx)
│   └── Dockerfile.dev          # Development (Vite HMR)
│
├── prisma/
│   └── schema.prisma           # Схема БД (5 моделей, 2 enum)
│
├── Dockerfile                  # Backend production (node:20-slim)
├── Dockerfile.dev              # Backend development (hot-reload)
├── docker-compose.yml          # Production
├── docker-compose.dev.yml      # Development
├── Makefile                    # Docker команды
├── jest.config.js              # Конфигурация тестов
├── tsconfig.json               # TypeScript конфиг
└── package.json
```

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Скопировать .env
cp .env.docker.example .env

# Сборка и запуск
docker-compose up -d --build

# Миграции и seed
make migrate-db
make seed-db
```

Сервисы: Frontend http://localhost:8081, Backend http://localhost:3000, PostgreSQL localhost:5434

### Вариант 2: Локальный запуск

```bash
# Установка зависимостей
npm install
cd frontend && npm install && cd ..

# Настройка .env
cp .env.example .env
# Отредактируйте DATABASE_URL и JWT_SECRET

# Миграции
npx prisma generate
npx prisma migrate dev

# Запуск (2 терминала)
npm run dev           # Backend на :3000
cd frontend && npm run dev  # Frontend на :5173
```

## API эндпоинты

### Публичные
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check |
| GET | `/api` | Информация об API |
| POST | `/api/auth/register` | Регистрация мастера |
| POST | `/api/auth/login` | Вход в систему |
| GET | `/api/public/:slug` | Данные мастера + услуги |
| POST | `/api/public/:slug/book` | Создание записи |

### Защищенные (требуется JWT)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/services` | Список услуг |
| POST | `/api/services` | Создание услуги |
| PUT | `/api/services/:id` | Обновление услуги |
| DELETE | `/api/services/:id` | Удаление услуги |
| GET | `/api/appointments` | Список записей |
| PUT | `/api/appointments/:id` | Обновление записи |
| GET | `/api/clients` | Список клиентов |
| POST | `/api/clients` | Создание клиента |
| POST | `/api/expenses` | Добавление расхода |
| GET | `/api/stats` | Финансовая статистика |

## Ключевая фишка: два режима записи

1. **SERVICE_LIST** — клиент выбирает услугу из списка с ценами, затем время
2. **TIME_SLOT** — клиент видит только свободные слоты, услуга и цена заполняются мастером постфактум

Режим переключается в настройках мастера.

## Frontend страницы

- `/` — Лендинг
- `/login`, `/register` — Аутентификация
- `/book/:slug` — Публичная страница записи к мастеру
- `/dashboard` — Календарь записей
- `/settings` — Управление услугами и режимом записи
- `/clients` — CRM с заметками
- `/expenses` — Учет расходов
- `/stats` — Финансовая статистика

## Демо-данные

- **Email:** test@example.com
- **Password:** password123
- **Публичная страница:** /book/test-master

## Docker команды (Makefile)

```bash
make build          # Собрать production
make up             # Запустить production
make dev            # Запустить development (hot-reload)
make down           # Остановить
make logs           # Логи всех сервисов
make migrate-db     # Миграции БД
make seed-db        # Тестовые данные
make clean          # Удалить всё
```

## Тестирование

Jest настроен (`jest.config.js`), зависимости установлены (jest, supertest, ts-jest). Автотесты ещё не написаны. Тест-кейсы описаны в `TEST_CASES.md`.

```bash
npm test              # Запуск тестов
npm run test:coverage # С покрытием
```

## Лицензия

MIT
