# Техническое задание и Правила проекта

## 1. Контекст проекта
- **Название**: BeautyShop - SaaS для бьюти-мастеров
- **Цель**: Создать веб-приложение для автоматизации бьюти-мастеров (косметологи, ногти, ресницы, парикмахеры) с записью клиентов, учетом услуг и финансов
- **Текущий статус**: MVP готово

## 2. Технологический стек
- **Язык**: Node.js 20+ + TypeScript
- **Фреймворк**: Express
- **База данных**: PostgreSQL
- **ORM**: Prisma
- **Фронтенд**: React 19 + Vite + TypeScript
- **UI**: Tailwind CSS
- **Auth**: JWT + Bcrypt
- **Тестирование**: Jest настроен, тесты ещё не написаны

## 3. Архитектура и Структура
Строго соблюдай следующую структуру папок:

```
beautyShop/
├── src/                    # исходный код бэкенда
│   ├── controllers/        # контроллеры
│   ├── routes/            # API routes
│   ├── middleware/        # middleware (auth, validation)
│   ├── utils/             # утилиты (jwt, bcrypt, slug)
│   ├── types/             # TypeScript типы
│   └── index.ts           # entry point
│
├── frontend/              # исходный код фронтенда
│   └── src/
│       ├── components/    # React компоненты
│       ├── pages/         # страницы
│       ├── hooks/         # custom hooks
│       ├── services/      # API client
│       └── main.tsx       # entry point
│
├── prisma/                # База данных
│   └── schema.prisma      # схема Prisma
│
├── tests/                 # автотесты (пока пусто)
├── docs/                  # документация (пока пусто)
├── SPEC.md                # этот файл (читай его перед каждой задачей)
├── PROGRESS.md            # файл со статусом выполненных задач (обновляй его)
└── ROADMAP.md             # файл с планом задач (читай перед началом работы)
```

## 4. Правила кодирования (Coding Standards)
- **Чистота**: Код должен быть чистым, без закомментированных блоков
- **Типизация**: Всегда указывай типы данных (TypeScript типы)
- **Документирование**: Пиши JSDoc для функций и классов
- **Безопасность**: Никогда не хардкодить секреты (пароли, ключи). Использовать .env
- **Простота**: Не усложняй архитектуру без необходимости (KISS)

## 5. Процесс разработки (Workflow)
Действуй строго по шагам:

1. **Анализ**: Перед написанием кода прочитай PROGRESS.md и ROADMAP.md, чтобы понять контекст
2. **Планирование**: Если задача сложная, сначала предложи план в чате, не пиши код сразу
3. **Тестирование**:
   - Пиши тесты для каждой новой функции
   - Читай файл TEST_CASES.md для списка проверок
   - После изменений запускай все тесты, чтобы убедиться, что ничего не сломало
4. **Фиксация**: После успешного выполнения задачи обнови PROGRESS.md (что сделано, какие файлы изменены)

## 6. Работа с ошибками
- Если возникает ошибка, сначала проанализируй лог ошибки
- Не предлагай "костыли". Ищи корневую причину (Root Cause)
- Если не знаешь, как решить, спроси пользователя

## 7. Ограничения памяти
Не пиши очень большие куски кода за один раз. Разбивай на логические блоки.

---

## ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ BEAUTYSHOP

### Уникальная логика продукта

Два режима записи (переключается в настройках мастера):

1. **SERVICE_LIST (Меню услуг)**:
   - Клиент видит список услуг с ценами и длительностью
   - Клиент выбирает услугу → выбирает время → записывается

2. **TIME_SLOT (Запись на время)**:
   - Клиент видит только свободные слоты времени
   - Клиент выбирает время → оставляет контакты
   - Услуга и цена не озвучиваются
   - Мастер заполняет их постфактум

### Функционал MVP

1. **Публичная страница записи** (`/book/:slug`)
   - Профиль мастера
   - Условный рендеринг в зависимости от режима
   - Форма записи (имя, телефон)

2. **Личный кабинет мастера**
   - Dashboard с календарем записей
   - Settings (CRUD услуг, переключение режима)
   - Clients (CRM с заметками)
   - Expenses (учет расходов)
   - Stats (финансовая статистика)

3. **База данных** (Prisma)
   - User (мастер): id, email, passwordHash, name, slug, bookingMode
   - Service (услуги): id, userId, name, price, durationMin, isPublic
   - Appointment (записи): id, userId, clientName, clientPhone, startTime, endTime, status, serviceId?, finalPrice?, notes?
   - Client (клиенты): id, userId, name, phone, notes
   - Expense (расходы): id, userId, amount, description, createdAt

4. **API Endpoints**
   - Auth: POST /api/auth/register, POST /api/auth/login
   - Public: GET /api/public/:slug, POST /api/public/:slug/book
   - Services: GET/POST/PUT/DELETE /api/services
   - Appointments: GET/PUT /api/appointments
   - Clients: GET/POST /api/clients
   - Expenses: POST /api/expenses
   - Stats: GET /api/stats

### Текущий статус

- ✅ Backend (Express + TypeScript + Prisma) - РАБОТАЕТ
- ✅ Frontend (React + Vite + Tailwind) - РАБОТАЕТ
- ✅ Database (PostgreSQL) - ПОДКЛЮЧЕНА
- ✅ Auth (JWT + Bcrypt) - РАБОТАЕТ
- ✅ Все API endpoints - РЕАЛИЗОВАНЫ
- ✅ Docker (Dockerfile + docker-compose) - РЕАЛИЗОВАН
- ❌ Tests - НЕ РЕАЛИЗОВАНЫ (Jest настроен, тесты не написаны)

### Демо-данные

**Тестовый пользователь:**
- Email: test@example.com
- Password: password123
- Slug: test-master
- Публичная страница: http://localhost:5173/book/test-master
