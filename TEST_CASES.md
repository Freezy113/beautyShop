# Тест-кейсы BeautyShop

## Обзор
Этот документ содержит полный список тестовых сценариев для BeautyShop SaaS платформы.

## Структура тестов

### Unit Tests (Юнит-тесты)
Тестирование отдельных функций и утилит без зависимостей от внешних систем.

**Расположение:** `tests/unit/`

### Integration Tests (Интеграционные тесты)
Тестирование API endpoints с реальной базой данных.

**Расположение:** `tests/integration/`

---

## UNIT TESTS

### 1. Auth Utils (`tests/unit/auth.test.ts`)

#### 1.1 hashPassword
- ✅ Должен хешировать пароль успешно
- ✅ Должен генерировать разные хеши для одного пароля (bcrypt salt)
- ✅ Хеш должен быть длиннее оригинального пароля

#### 1.2 comparePassword
- ✅ Должен возвращать true для правильного пароля
- ✅ Должен возвращать false для неправильного пароля

#### 1.3 generateToken
- ✅ Должен генерировать валидный JWT токен
- ✅ Токен должен иметь 3 части (header.payload.signature)
- ✅ Должен включать payload в токен

#### 1.4 verifyToken
- ✅ Должен верифицировать валидный токен
- ✅ Должен выбрасывать ошибку для невалидного токена

#### 1.5 generateSlug
- ✅ Должен генерировать slug из имени
- ✅ Должен транслитерировать кириллицу в латиницу
- ✅ Должен убирать специальные символы
- ✅ Должен генерировать уникальные slug'и

---

## INTEGRATION TESTS

### 2. Auth API (`tests/integration/auth.test.ts`)

#### 2.1 POST /api/auth/register

**Сценарий 2.1.1: Успешная регистрация**
- **Given:** Валидные данные пользователя (email, password, name)
- **When:** POST запрос на /api/auth/register
- **Then:** Статус 201
- **And:** В ответе есть user, token
- **And:** User имеет id, email, name, slug
- **And:** Slug уникальный
- **And:** Password хеширован (не возвращается в ответе)

**Сценарий 2.1.2: Регистрация с существующим email**
- **Given:** Пользователь с email уже существует
- **When:** POST запрос с тем же email
- **Then:** Статус 400
- **And:** В ответе есть error

**Сценарий 2.1.3: Регистрация с невалидными данными**
- **Given:** Невалидный email или короткий пароль
- **When:** POST запрос с невалидными данными
- **Then:** Статус 400
- **And:** В ответе есть ошибки валидации

#### 2.2 POST /api/auth/login

**Сценарий 2.2.1: Успешный логин**
- **Given:** Зарегистрированный пользователь
- **When:** POST запрос с правильными email и password
- **Then:** Статус 200
- **And:** В ответе есть user, token
- **And:** Token валидный JWT

**Сценарий 2.2.2: Логин с неправильным паролем**
- **Given:** Зарегистрированный пользователь
- **When:** POST запрос с неправильным паролем
- **Then:** Статус 400
- **And:** В ответе есть error

**Сценарий 2.2.3: Логин несуществующего пользователя**
- **Given:** Пользователь не существует
- **When:** POST запрос с email
- **Then:** Статус 400
- **And:** В ответе есть error

---

### 3. Services API (`tests/integration/services.test.ts`)

#### 3.1 POST /api/services

**Сценарий 3.1.1: Создание услуги (авторизован)**
- **Given:** Авторизованный пользователь
- **When:** POST запрос с валидными данными услуги
- **Then:** Статус 201
- **And:** В ответе есть service с id, name, price, durationMin
- **And:** Service создан в БД

**Сценарий 3.1.2: Создание услуги (без авторизации)**
- **Given:** Неавторизованный запрос
- **When:** POST запрос на /api/services
- **Then:** Статус 401
- **And:** В ответе есть error

**Сценарий 3.1.3: Создание услуги с невалидными данными**
- **Given:** Авторизованный пользователь
- **When:** POST запрос без name, price или durationMin
- **Then:** Статус 400
- **And:** В ответе есть ошибки валидации

#### 3.2 GET /api/services

**Сценарий 3.2.1: Получение услуг (авторизован)**
- **Given:** Авторизованный пользователь с услугами
- **When:** GET запрос на /api/services
- **Then:** Статус 200
- **And:** В ответе массив services
- **And:** Только услуги текущего пользователя

**Сценарий 3.2.2: Получение услуг (без авторизации)**
- **Given:** Неавторизованный запрос
- **When:** GET запрос на /api/services
- **Then:** Статус 401

---

### 4. Public API (`tests/integration/public.test.ts`)

#### 4.1 GET /api/public/:slug

**Сценарий 4.1.1: Получение данных мастера**
- **Given:** Мастер с slug существует
- **When:** GET запрос на /api/public/{slug}
- **Then:** Статус 200
- **And:** В ответе: name, bookingMode, services
- **And:** Services только с isPublic=true

**Сценарий 4.1.2: Мастер не найден**
- **Given:** Мастер с slug не существует
- **When:** GET запрос на /api/public/{nonexistent}
- **Then:** Статус 404

#### 4.2 POST /api/public/:slug/book

**Сценарий 4.2.1: Запись на услугу (SERVICE_LIST mode)**
- **Given:** Мастер в режиме SERVICE_LIST
- **When:** POST запрос с clientName, clientPhone, serviceId, startTime
- **Then:** Статус 201
- **And:** Запись создана в БД
- **And:** endTime рассчитан на основе durationMin услуги

**Сценарий 4.2.2: Запись на время (TIME_SLOT mode)**
- **Given:** Мастер в режиме TIME_SLOT
- **When:** POST запрос с clientName, clientPhone, startTime, endTime
- **Then:** Статус 201
- **And:** Запись создана без serviceId

**Сценарий 4.2.3: Пересечение времени**
- **Given:** Существующая запись на время
- **When:** POST запрос с пересекающимся временем
- **Then:** Статус 409
- **And:** В ответе есть error о занятости

---

### 5. Appointments API (`tests/integration/appointments.test.ts`)

#### 5.1 GET /api/appointments

**Сценарий 5.1.1: Получение записей**
- **Given:** Авторизованный пользователь с записями
- **When:** GET запрос на /api/appointments
- **Then:** Статус 200
- **And:** Массив записей пользователя
- **And:** Каждая запись имеет clientName, startTime, endTime, status

#### 5.2 PUT /api/appointments/:id

**Сценарий 5.2.1: Обновление записи**
- **Given:** Авторизованный пользователь с записью
- **When:** PUT запрос с status=COMPLETED, finalPrice
- **Then:** Статус 200
- **And:** Запись обновлена в БД

---

### 6. Clients API (`tests/integration/clients.test.ts`)

#### 6.1 POST /api/clients

**Сценарий 6.1.1: Создание клиента**
- **Given:** Авторизованный пользователь
- **When:** POST запрос с name, phone, notes
- **Then:** Статус 201
- **And:** Клиент создан в БД

**Сценарий 6.1.2: Обновление существующего клиента**
- **Given:** Клиент с таким phone уже существует
- **When:** POST запрос с тем же phone
- **Then:** Клиент обновлен, а не дублирован

---

### 7. Expenses API (`tests/integration/expenses.test.ts`)

#### 7.1 POST /api/expenses

**Сценарий 7.1.1: Добавление расхода**
- **Given:** Авторизованный пользователь
- **When:** POST запрос с amount, description
- **Then:** Статус 201
- **And:** Расход создан в БД

---

### 8. Stats API (`tests/integration/stats.test.ts`)

#### 8.1 GET /api/stats

**Сценарий 8.1.1: Получение статистики**
- **Given:** Авторизованный пользователь с записями и расходами
- **When:** GET запрос на /api/stats
- **Then:** Статус 200
- **And:** В ответе: income, expenses, profit, appointmentsCount
- **And:** Profit = income - expenses

---

## Фронтенд тесты (опционально)

### 9. Components Tests (`tests/components/`)

#### 9.1 Auth Components
- LoginPage.tsx
  - Рендеринг формы
  - Валидация email
  - Валидация пароля
  - Вызов onSubmit

- RegisterPage.tsx
  - Рендеринг формы
  - Валидация всех полей
  - Выбор bookingMode

#### 9.2 Dashboard Components
- DashboardPage.tsx
  - Рендеринг календаря
  - Отображение записей

- SettingsPage.tsx
  - Отображение списка услуг
  - Создание услуги
  - Редактирование услуги

#### 9.3 Public Components
- BookingPage.tsx
  - Условный рендеринг (SERVICE_LIST vs TIME_SLOT)
  - Форма записи

---

## Покрытие кода

### Минимальные требования:

- **Utils:** 100% (критично)
- **Controllers:** 80%+
- **Routes:** 70%+
- **Frontend:** 50%+ (опционально для MVP)

### Команды для проверки покрытия:

```bash
npm run test:coverage
```

---

## Запуск тестов

### Все тесты:
```bash
npm test
```

### Вотч-режим:
```bash
npm run test:watch
```

### С покрытием:
```bash
npm run test:coverage
```

### Конкретный тест:
```bash
npm test -- auth.test.ts
```

---

## Continuous Integration

### Тесты должны проходить:

1. Перед каждым коммитом
2. В CI/CD пайплайне
3. Перед слиянием в main

### Ветка разработки:

- red → green → refactor workflow
- Тесты не должны ломаться в main

---

*Дата создания: 2025-02-24*
*Версия: 1.0*
*Статус: Тесты добавляются*
