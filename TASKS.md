# Задачи по улучшению BeautyShop

**Проект:** `/e/beautyshop/beautyShop/`
**Стек:** Backend (Express + TypeScript + Prisma + PostgreSQL), Frontend (React 19 + Vite + Tailwind)
**Перед началом:** прочитай SPEC.md для понимания контекста проекта.

---

## ЗАДАЧА 1: Удалить мёртвый код

**Приоритет:** Критический
**Зависимости:** Нет

### Что сделать:
Удалить 3 файла, которые не используются нигде в проекте:

1. `src/index-dummy.ts` — демо-версия сервера без БД, не импортируется
2. `src/index-fixed.ts` — копия index-dummy.ts, не импортируется
3. `src/test.ts` — тестовый "Hello World" сервер, не импортируется

### Команды:
```bash
rm src/index-dummy.ts src/index-fixed.ts src/test.ts
```

### Проверка:
- `src/index.ts` должен остаться (это рабочий entry point)
- `npm run build` должен пройти без ошибок
- Grep по проекту: ни один файл не должен импортировать удалённые файлы

---

## ЗАДАЧА 2: Создать prisma/seed.ts

**Приоритет:** Критический
**Зависимости:** Нет

### Контекст:
В `package.json` строка 51 прописано `"seed": "ts-node prisma/seed.ts"`, но файл `prisma/seed.ts` не существует. Любой вызов `npx prisma db seed` падает с ошибкой.

### Что сделать:
Создать файл `prisma/seed.ts` со следующей логикой:

1. Импортировать PrismaClient и функции из `src/utils/auth.ts` (hashPassword, generateSlug)
2. Создать тестового пользователя:
   - email: `test@example.com`
   - password: `password123` (захешировать через hashPassword)
   - name: `Тест Мастер`
   - slug: `test-master`
   - bookingMode: `SERVICE_LIST`
3. Создать 3 услуги для этого пользователя:
   - Маникюр: 1500 руб, 60 мин, isPublic: true
   - Педикюр: 2000 руб, 90 мин, isPublic: true
   - Коррекция бровей: 800 руб, 30 мин, isPublic: true
4. Создать 2 клиентов:
   - Мария Петрова, +79991234567
   - Анна Сидорова, +79997654321
5. Использовать `upsert` вместо `create` чтобы seed можно было запускать повторно без ошибок
6. Обернуть в `async function main()` и вызвать с `finally { prisma.$disconnect() }`

### Структура файла:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // upsert user
  // upsert services
  // upsert clients
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Важно:
- НЕ импортировать из `src/utils/auth.ts` — там PrismaClient создаётся отдельно. Вместо этого использовать `bcrypt.hash(password, 10)` напрямую.
- slug для тестового пользователя хардкодить как `test-master` (не генерировать)

### Проверка:
- `npx prisma db seed` выполняется без ошибок
- Повторный запуск `npx prisma db seed` тоже без ошибок (благодаря upsert)
- `GET /api/public/test-master` возвращает данные мастера с 3 услугами

---

## ЗАДАЧА 3: Создать миграцию Prisma и закоммитить

**Приоритет:** Критический
**Зависимости:** Нет

### Контекст:
Папка `prisma/migrations/` не существует в репозитории. При клонировании проекта новым разработчиком `npx prisma migrate deploy` не сработает.

### Что сделать:
1. Сгенерировать начальную миграцию:
```bash
npx prisma migrate dev --name init
```
2. Убедиться, что папка `prisma/migrations/` появилась и содержит SQL файл
3. Добавить в git: `prisma/migrations/`

### Проверка:
- `prisma/migrations/` содержит как минимум одну миграцию
- В миграции есть создание таблиц: User, Service, Appointment, Client, Expense
- `npx prisma migrate deploy` на чистой БД проходит успешно

---

## ЗАДАЧА 4: Настроить CORS

**Приоритет:** Критический
**Зависимости:** Нет

### Контекст:
В `src/index.ts` строка 25: `app.use(cors())` — без параметров разрешает запросы с ЛЮБОГО домена.

### Что сделать:
Заменить `app.use(cors())` в `src/index.ts` на:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:8081'],
  credentials: true,
}));
```

Добавить в `.env.example`:
```
CORS_ORIGINS="http://localhost:5173,http://localhost:8081"
```

Добавить в `.env.docker.example`:
```
CORS_ORIGINS="http://localhost:8081"
```

### Проверка:
- Запросы с `http://localhost:5173` проходят
- Запросы с `http://evil-site.com` блокируются (заголовок Access-Control-Allow-Origin не возвращается)

---

## ЗАДАЧА 5: Добавить rate limiting

**Приоритет:** Важный
**Зависимости:** Нет

### Что сделать:

1. Установить пакет:
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

2. Создать файл `src/middleware/rateLimit.ts`:

```typescript
import rateLimit from 'express-rate-limit';

// Общий лимит: 100 запросов за 15 минут
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для auth: 10 попыток за 15 минут
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Слишком много попыток входа, попробуйте через 15 минут' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для бронирования: 20 за 15 минут
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много запросов на бронирование' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

3. Подключить в `src/index.ts`:
   - `generalLimiter` — на весь `app` (после `app.use(express.json())`)
   - `authLimiter` — на `app.use('/api/auth', authLimiter, authRoutes)`
   - `bookingLimiter` — на `app.use('/api/public', bookingLimiter, publicRoutes)`

### Проверка:
- 11-й запрос на `/api/auth/login` за 15 минут возвращает 429
- Обычные API запросы работают нормально до лимита 100

---

## ЗАДАЧА 6: Добавить пагинацию

**Приоритет:** Важный
**Зависимости:** Нет

### Контекст:
Эндпоинты `GET /api/appointments`, `GET /api/clients`, `GET /api/expenses` возвращают ВСЕ записи без лимитов.

### Что сделать:

**6.1. Backend — добавить query параметры `page` и `limit`**

Изменить контроллеры, добавив пагинацию. Шаблон:

```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.MODEL.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { ... }
  }),
  prisma.MODEL.count({ where: whereClause })
]);

res.json({
  data: items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});
```

Применить к:
- `src/controllers/appointmentsController.ts` → `getAppointments` (сейчас строки 32-44, `findMany` без лимита)
- `src/controllers/clientsController.ts` → `getClients` (сейчас строки 10-13, `findMany` без лимита)
- `src/controllers/expensesController.ts` → `getExpenses` (сейчас строки 37-40, `findMany` без лимита)

**6.2. Frontend — обновить API client и страницы**

Обновить `frontend/src/services/api.ts`:
```typescript
getAppointments: (page = 1, limit = 50): Promise<...> =>
  api.get(`/appointments?page=${page}&limit=${limit}`),

getClients: (page = 1, limit = 50): Promise<...> =>
  api.get(`/clients?page=${page}&limit=${limit}`),

getExpenses: (page = 1, limit = 50): Promise<...> =>
  api.get(`/expenses?page=${page}&limit=${limit}`),
```

Обновить frontend типы в `frontend/src/types/index.ts` — добавить:
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

Обновить страницы (`DashboardPage.tsx`, `ClientsPage.tsx`, `ExpensesPage.tsx`):
- Извлекать данные из `response.data.data` вместо `response.data`
- Пока не обязательно рендерить UI пагинации (можно запрашивать limit=1000 для совместимости)

### Проверка:
- `GET /api/appointments?page=1&limit=10` возвращает объект с `data` и `pagination`
- `GET /api/appointments` (без параметров) возвращает первые 20 записей по умолчанию
- Frontend не ломается

---

## ЗАДАЧА 7: Refresh Token

**Приоритет:** Важный
**Зависимости:** Нет

### Контекст:
Сейчас выдаётся только access token (JWT, срок жизни 7 дней — см. `src/utils/auth.ts` строка 20). Нет механизма обновления без перелогина.

### Что сделать:

**7.1. Backend:**

1. В `src/utils/auth.ts`:
   - Изменить `generateToken` — сделать access token на 1 час: `expiresIn: '1h'`
   - Добавить `generateRefreshToken` — refresh token на 30 дней: `expiresIn: '30d'`, другой секрет `process.env.JWT_REFRESH_SECRET`
   - Добавить `verifyRefreshToken` — верификация refresh token

2. В `src/controllers/authController.ts`:
   - В `register` и `login`: возвращать и `token` (access), и `refreshToken`

3. В `src/routes/auth.ts`:
   - Добавить `POST /api/auth/refresh` — принимает `{ refreshToken }`, проверяет, возвращает новую пару `{ token, refreshToken }`

4. В `.env.example` и `.env.docker.example` добавить:
```
JWT_REFRESH_SECRET="another-secret-key-for-refresh-tokens"
```

**7.2. Frontend:**

1. В `frontend/src/services/api.ts`:
   - Хранить refreshToken в localStorage отдельно от token
   - В interceptor на 401: попробовать вызвать `/api/auth/refresh` с refreshToken
   - Если refresh успешен — обновить оба токена и повторить оригинальный запрос
   - Если refresh неуспешен — только тогда редирект на `/login`

2. В `frontend/src/hooks/useAuth.tsx`:
   - При login/register сохранять оба токена

### Проверка:
- После логина получаем token (короткий) и refreshToken (длинный)
- Через 1 час access token протухает, но refresh автоматически обновляет его
- При протухшем refreshToken происходит редирект на /login

---

## ЗАДАЧА 8: Валидация формы бронирования на фронтенде

**Приоритет:** Важный
**Зависимости:** Нет

### Контекст:
В `frontend/src/pages/public/BookingPage.tsx`, функция `validateForm` (строки 47-58) проверяет только наличие полей, но не их формат. Телефон принимается в любом виде. Время не проверяется (можно записаться в прошлом).

### Что сделать:

1. В `frontend/src/pages/public/BookingPage.tsx`, функция `validateForm`:

Добавить проверки:
```typescript
// Телефон: минимум 10 цифр
const phoneDigits = formData.clientPhone.replace(/\D/g, '');
if (phoneDigits.length < 10) {
  newErrors.clientPhone = 'Введите корректный номер телефона (минимум 10 цифр)';
}

// Время: только в будущем
if (selectedDate && selectedTime) {
  const bookingDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`);
  if (bookingDateTime <= new Date()) {
    newErrors.time = 'Нельзя записаться на прошедшее время';
  }
}

// Имя: минимум 2 символа
if (formData.clientName.trim().length < 2) {
  newErrors.clientName = 'Имя должно содержать минимум 2 символа';
}
```

2. Добавить маску/форматирование телефона:
   - При вводе автоматически добавлять `+7` в начало (если нет)
   - Или хотя бы подсказку в placeholder: `+7 (999) 123-45-67` (уже есть в placeholder, но формат не контролируется)

### Проверка:
- Телефон `123` не проходит валидацию
- Запись на вчера не проходит валидацию
- Имя из 1 символа не проходит
- Корректные данные проходят нормально

---

## ЗАДАЧА 9: Логирование (winston)

**Приоритет:** Важный
**Зависимости:** Нет

### Что сделать:

1. Установить:
```bash
npm install winston
```

2. Создать `src/utils/logger.ts`:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautyshop-api' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
  ],
});

// В production добавить файловый транспорт
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

export default logger;
```

3. Заменить ВСЕ `console.error(...)` и `console.log(...)` в проекте на `logger`:

Файлы для замены (каждый содержит `console.error`):
- `src/controllers/authController.ts` (строки 56, 117, 162) → `logger.error('Registration error', { error })`
- `src/controllers/appointmentsController.ts` (строки 48, 116)
- `src/controllers/clientsController.ts` (строки 17, 57, 87)
- `src/controllers/expensesController.ts` (строки 30, 44)
- `src/controllers/publicController.ts` (строки 48, 89)
- `src/controllers/servicesController.ts` (строки 17, 46, 88, 122)
- `src/controllers/statsController.ts` (строка 67)
- `src/index.ts` (строки 91, 102, 104, 127, 132) — заменить console.log на logger.info, console.error на logger.error

В каждом контроллере добавить `import logger from '../utils/logger';` и заменить:
- `console.error('Some error:', error)` → `logger.error('Some error', { error: error instanceof Error ? error.message : error })`
- `console.log(...)` → `logger.info(...)`

4. Добавить `logs/` в `.gitignore` (создать файл если нет, или добавить строку)
5. Добавить `logs/` в `.dockerignore`

### Проверка:
- Нигде в `src/` не осталось `console.log` или `console.error`
- В development — логи цветные в консоли
- В production (NODE_ENV=production) — логи JSON, пишутся в файлы `logs/error.log` и `logs/combined.log`
- `npm run build` проходит

---

## ЗАДАЧА 10: Уведомления (Telegram бот)

**Приоритет:** Средний (бизнес-фича)
**Зависимости:** Задача 9 (логирование)

### Контекст:
Бьюти-мастера хотят получать уведомления о новых записях. Telegram — самый простой и популярный канал.

### Что сделать:

1. Установить:
```bash
npm install node-telegram-bot-api
npm install -D @types/node-telegram-bot-api
```

2. Создать `src/services/notifications.ts`:

```typescript
import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';

let bot: TelegramBot | null = null;

export const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not set, notifications disabled');
    return;
  }
  bot = new TelegramBot(token, { polling: false }); // webhook режим не нужен, только отправка
};

export const sendNewBookingNotification = async (
  telegramChatId: string,
  data: {
    clientName: string;
    clientPhone: string;
    serviceName?: string;
    startTime: Date;
  }
) => {
  if (!bot || !telegramChatId) return;

  const dateStr = data.startTime.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });

  const message = [
    '📋 Новая запись!',
    '',
    `👤 Клиент: ${data.clientName}`,
    `📱 Телефон: ${data.clientPhone}`,
    data.serviceName ? `💅 Услуга: ${data.serviceName}` : '',
    `📅 Дата: ${dateStr}`,
  ].filter(Boolean).join('\n');

  try {
    await bot.sendMessage(telegramChatId, message);
  } catch (error) {
    logger.error('Failed to send Telegram notification', { error, telegramChatId });
  }
};
```

3. Расширить модель User в `prisma/schema.prisma` — добавить поле:
```prisma
model User {
  // ... существующие поля ...
  telegramChatId  String?    // ID чата в Telegram для уведомлений
}
```

4. Создать миграцию: `npx prisma migrate dev --name add-telegram-chat-id`

5. Вызывать `sendNewBookingNotification` в `src/controllers/publicController.ts` после успешного создания записи (в функции `bookAppointment`, после строки 82):

```typescript
// После создания appointment
const masterUser = await prisma.user.findUnique({ where: { id: user.id } });
if (masterUser?.telegramChatId) {
  const serviceName = serviceId
    ? (await prisma.service.findUnique({ where: { id: serviceId } }))?.name
    : undefined;
  sendNewBookingNotification(masterUser.telegramChatId, {
    clientName,
    clientPhone,
    serviceName: serviceName || undefined,
    startTime: new Date(startTime),
  });
}
```

6. Инициализировать бота в `src/index.ts` (после dotenv.config()):
```typescript
import { initTelegramBot } from './services/notifications';
initTelegramBot();
```

7. Добавить в `.env.example`:
```
# Telegram уведомления (опционально)
TELEGRAM_BOT_TOKEN=""
```

8. Добавить endpoint `PUT /api/auth/settings` для сохранения telegramChatId мастером (или добавить в существующий Settings функционал)

### Проверка:
- Без TELEGRAM_BOT_TOKEN — приложение работает нормально, в логах warning
- С токеном и chatId — при бронировании мастеру приходит сообщение в Telegram
- Ошибка Telegram НЕ ломает бронирование (fire-and-forget)

---

## ЗАДАЧА 11: Восстановление пароля

**Приоритет:** Средний (бизнес-фича)
**Зависимости:** Задача 9 (логирование)

### Что сделать:

**11.1. Backend:**

1. Расширить модель User в `prisma/schema.prisma`:
```prisma
model User {
  // ... существующие поля ...
  resetToken       String?
  resetTokenExpiry DateTime?
}
```

2. Создать миграцию: `npx prisma migrate dev --name add-reset-token`

3. Добавить 2 эндпоинта в `src/routes/auth.ts`:
   - `POST /api/auth/forgot-password` — принимает `{ email }`, генерирует resetToken (random UUID), сохраняет в User, отдаёт токен в ответе (для MVP без email — просто возвращаем ссылку)
   - `POST /api/auth/reset-password` — принимает `{ token, newPassword }`, проверяет токен и срок, обновляет пароль, очищает resetToken

4. Создать `src/controllers/authController.ts` — добавить функции:

```typescript
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Не раскрываем существование пользователя
    return res.json({ message: 'Если email зарегистрирован, ссылка для сброса отправлена' });
  }
  const resetToken = crypto.randomUUID();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 час
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry }
  });
  // В будущем: отправить email. Для MVP — вернуть ссылку в ответе
  res.json({
    message: 'Ссылка для сброса пароля',
    resetLink: `/reset-password?token=${resetToken}`
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Невалидные данные' });
  }
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    }
  });
  if (!user) {
    return res.status(400).json({ error: 'Токен недействителен или истёк' });
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null }
  });
  res.json({ message: 'Пароль успешно изменён' });
};
```

**11.2. Frontend:**

1. Создать `frontend/src/pages/auth/ForgotPasswordPage.tsx`:
   - Форма с полем email
   - POST на `/api/auth/forgot-password`
   - Показать сообщение об успехе

2. Создать `frontend/src/pages/auth/ResetPasswordPage.tsx`:
   - Читать `token` из URL query params
   - Форма с полями: новый пароль, подтверждение пароля
   - POST на `/api/auth/reset-password`
   - При успехе — редирект на `/login`

3. Добавить роуты в `frontend/src/App.tsx`:
```tsx
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

4. На странице `/login` добавить ссылку "Забыли пароль?" → `/forgot-password`

5. Добавить методы в `frontend/src/services/api.ts`:
```typescript
forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
```

### Проверка:
- `POST /api/auth/forgot-password` с существующим email возвращает resetLink
- `POST /api/auth/reset-password` с валидным токеном и новым паролем меняет пароль
- Протухший токен (>1 час) отклоняется
- Повторное использование токена отклоняется
- Новый пароль работает для логина

---

## ЗАДАЧА 12: Отмена записи клиентом

**Приоритет:** Средний (бизнес-фича)
**Зависимости:** Нет

### Что сделать:

**12.1. Backend:**

1. Расширить модель Appointment в `prisma/schema.prisma`:
```prisma
model Appointment {
  // ... существующие поля ...
  cancelToken  String?  @unique  // Токен для отмены клиентом
}
```

2. Создать миграцию: `npx prisma migrate dev --name add-cancel-token`

3. В `src/controllers/publicController.ts`, функция `bookAppointment`:
   - При создании записи генерировать `cancelToken` (crypto.randomUUID)
   - Сохранять в Appointment
   - Возвращать клиенту cancelLink: `/book/{slug}/cancel?token={cancelToken}`

4. Добавить эндпоинт в `src/routes/public.ts`:
```typescript
router.post('/:slug/cancel', publicController.cancelAppointment);
```

5. Добавить в `src/controllers/publicController.ts`:
```typescript
export const cancelAppointment = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Токен не указан' });
  }
  const appointment = await prisma.appointment.findFirst({
    where: { cancelToken: token, status: { in: ['BOOKED', 'CONFIRMED'] } }
  });
  if (!appointment) {
    return res.status(404).json({ error: 'Запись не найдена или уже отменена' });
  }
  // Не позволять отменять менее чем за 2 часа
  const hoursBeforeAppointment = (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursBeforeAppointment < 2) {
    return res.status(400).json({ error: 'Отмена возможна не позднее чем за 2 часа до записи' });
  }
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CANCELED', cancelToken: null }
  });
  res.json({ message: 'Запись успешно отменена' });
};
```

**12.2. Frontend:**

1. На странице успешного бронирования (BookingPage.tsx) — показать ссылку для отмены
2. Создать простую страницу `/book/:slug/cancel` с кнопкой "Отменить запись"

### Проверка:
- При бронировании возвращается cancelLink
- POST с валидным cancelToken отменяет запись
- Нельзя отменить менее чем за 2 часа
- Нельзя отменить уже отменённую запись

---

## ЗАДАЧА 13: Рабочий график мастера

**Приоритет:** Средний (бизнес-фича)
**Зависимости:** Нет

### Что сделать:

**13.1. Database:**

Добавить модель в `prisma/schema.prisma`:
```prisma
model WorkSchedule {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dayOfWeek Int      // 0=Вс, 1=Пн, ..., 6=Сб
  startTime String   // "09:00"
  endTime   String   // "18:00"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, dayOfWeek])
}
```

В модели User добавить:
```prisma
model User {
  // ... существующие поля ...
  workSchedules  WorkSchedule[]
}
```

Создать миграцию: `npx prisma migrate dev --name add-work-schedule`

**13.2. Backend:**

1. Создать `src/controllers/scheduleController.ts`:
   - `GET /api/schedule` — получить расписание мастера (7 дней)
   - `PUT /api/schedule` — обновить расписание (принимает массив из 7 дней)

2. Создать `src/routes/schedule.ts` и подключить в `src/index.ts`

3. В `src/controllers/publicController.ts`, функция `getMasterData`:
   - Добавить workSchedules в select (вернуть расписание клиенту)

4. В `src/controllers/publicController.ts`, функция `bookAppointment`:
   - Проверить, что время записи попадает в рабочие часы мастера
   - Если нет рабочего расписания — пропустить проверку (обратная совместимость)

**13.3. Frontend:**

1. На странице `SettingsPage.tsx` добавить секцию "Рабочие часы":
   - 7 строк (Пн-Вс)
   - Для каждого дня: toggle (вкл/выкл), время начала, время окончания
   - Кнопка сохранить

2. На `BookingPage.tsx`:
   - Если у мастера есть рабочее расписание, показывать только доступные слоты
   - Заблокировать выбор выходных дней

3. Добавить в `frontend/src/types/index.ts`:
```typescript
export interface WorkSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}
```

4. Добавить в `frontend/src/services/api.ts`:
```typescript
getSchedule: () => api.get('/schedule'),
updateSchedule: (data: WorkSchedule[]) => api.put('/schedule', { schedule: data }),
```

### Проверка:
- Мастер может задать рабочие часы (9:00-18:00 Пн-Пт, выходные Сб-Вс)
- Клиент не видит слоты вне рабочих часов
- Клиент не может записаться на выходной
- Без рабочего расписания — всё работает как раньше (обратная совместимость)

---

## ЗАДАЧА 14: Фото профиля

**Приоритет:** Низкий (бизнес-фича)
**Зависимости:** Нет

### Что сделать:

**14.1. Backend:**

1. Установить:
```bash
npm install multer
npm install -D @types/multer
```

2. Расширить модель User в `prisma/schema.prisma`:
```prisma
model User {
  // ... существующие поля ...
  avatarUrl  String?   // Путь к фото профиля
}
```

3. Создать миграцию: `npx prisma migrate dev --name add-avatar`

4. Создать `src/middleware/upload.ts`:
```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: 'uploads/avatars/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимые форматы: jpg, jpeg, png, webp'));
    }
  }
}).single('avatar');
```

5. Добавить endpoint `POST /api/auth/avatar`:
   - Принимает multipart/form-data с файлом
   - Сохраняет файл в `uploads/avatars/`
   - Обновляет `avatarUrl` пользователя

6. В `src/index.ts` добавить статическую раздачу:
```typescript
app.use('/uploads', express.static('uploads'));
```

7. В `getMasterData` (publicController) — добавить avatarUrl в select

**14.2. Frontend:**

1. На `SettingsPage.tsx`: добавить блок загрузки аватара (input type="file", preview)
2. На `BookingPage.tsx`: показывать аватар мастера (если есть)

3. Создать директорию `uploads/avatars/` и добавить в `.gitignore`:
```
uploads/
```

### Проверка:
- Мастер может загрузить фото (jpg/png, до 5МБ)
- Фото доступно по URL `/uploads/avatars/{filename}`
- На публичной странице видно аватар мастера
- Файлы > 5МБ и неподдерживаемые форматы отклоняются

---

## ЗАДАЧА 15: Исправить docker-compose version

**Приоритет:** Низкий (техдолг)
**Зависимости:** Нет

### Что сделать:
Удалить строку `version: '3.8'` из:
1. `docker-compose.yml` (строка 1)
2. `docker-compose.dev.yml` (строка 1)

Начиная с Docker Compose V2, поле `version` deprecated и игнорируется.

### Проверка:
- `docker-compose config` не выдаёт warnings
- `docker-compose up` работает

---

## ЗАДАЧА 16: Unit-тесты для utils/auth.ts

**Приоритет:** Важный
**Зависимости:** Нет

### Контекст:
Jest настроен (`jest.config.js`), зависимости установлены. Конфиг ссылается на `tests/setup.ts`, но папка `tests/` не существует. Файл `src/utils/auth.ts` — самый критичный модуль.

### Что сделать:

1. Создать директории:
```bash
mkdir -p tests/unit tests/integration
```

2. Создать `tests/setup.ts`:
```typescript
// Jest setup file
// Устанавливаем тестовые переменные окружения
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.NODE_ENV = 'test';
```

3. Создать `tests/unit/auth.test.ts`:

Тесты для каждой функции из `src/utils/auth.ts`:

```typescript
import { hashPassword, comparePassword, generateToken, verifyToken, generateSlug } from '../../src/utils/auth';

describe('hashPassword', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('password123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should generate different hashes for same password', async () => {
    const hash1 = await hashPassword('password123');
    const hash2 = await hashPassword('password123');
    expect(hash1).not.toBe(hash2);
  });
});

describe('comparePassword', () => {
  it('should return true for correct password', async () => {
    const hash = await hashPassword('password123');
    const result = await comparePassword('password123', hash);
    expect(result).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hash = await hashPassword('password123');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});

describe('generateToken', () => {
  it('should generate valid JWT token', () => {
    const token = generateToken({ id: '123', email: 'test@test.com' });
    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('verifyToken', () => {
  it('should verify valid token', () => {
    const token = generateToken({ id: '123' });
    const decoded = verifyToken(token);
    expect(decoded.id).toBe('123');
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
  });
});

describe('generateSlug', () => {
  it('should generate slug from name', () => {
    expect(generateSlug('Test Master')).toBe('test-master');
  });

  it('should handle cyrillic', () => {
    const slug = generateSlug('Мастер Красоты');
    expect(slug).toBe('мастер-красоты');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Test!@#Master')).toBe('testmaster');
  });

  it('should collapse multiple dashes', () => {
    expect(generateSlug('Test   Master')).toBe('test-master');
  });
});
```

4. **Важно:** Функция `isTimeSlotAvailable` из `src/utils/auth.ts` зависит от Prisma (БД). Для unit-тестов она НЕ тестируется. Она будет покрыта интеграционными тестами позже. Если Jest ругается на PrismaClient при импорте, нужно замокать:
   - Создать `tests/__mocks__/@prisma/client.ts`:
   ```typescript
   export const PrismaClient = jest.fn().mockImplementation(() => ({
     appointment: { count: jest.fn().mockResolvedValue(0) },
     $disconnect: jest.fn(),
   }));
   ```

### Проверка:
- `npm test` проходит, все тесты зелёные
- `npm run test:coverage` показывает покрытие для `src/utils/auth.ts` ≥ 80%

---

## ЗАДАЧА 17: Актуализировать .env.example

**Приоритет:** Низкий (техдолг)
**Зависимости:** Задачи 4, 7, 9, 10

### Что сделать:

Файл `.env.example` — привести в соответствие со всеми добавленными переменными:

```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/beautyshop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
NODE_ENV="development"
LOG_LEVEL="info"
CORS_ORIGINS="http://localhost:5173,http://localhost:8081"

# Telegram уведомления (опционально)
TELEGRAM_BOT_TOKEN=""
```

Аналогично обновить `.env.docker.example`.

### Проверка:
- Все переменные, используемые через `process.env.XXX` в коде, перечислены в `.env.example`

---

## Порядок выполнения

**Фаза 1 (критичное, без зависимостей — можно параллельно):**
- Задача 1: Удалить мёртвый код
- Задача 2: Создать seed.ts
- Задача 3: Миграции
- Задача 4: CORS
- Задача 15: docker-compose version

**Фаза 2 (важное — можно параллельно):**
- Задача 5: Rate limiting
- Задача 6: Пагинация
- Задача 8: Валидация формы
- Задача 9: Логирование (winston)
- Задача 16: Unit-тесты

**Фаза 3 (бизнес-фичи — после фазы 2, можно параллельно):**
- Задача 7: Refresh Token
- Задача 10: Telegram уведомления (зависит от задачи 9)
- Задача 11: Восстановление пароля (зависит от задачи 9)
- Задача 12: Отмена записи клиентом
- Задача 13: Рабочий график мастера

**Фаза 4 (финализация):**
- Задача 14: Фото профиля
- Задача 17: Актуализация .env.example

---

## Общие правила

1. **Перед изменением файла** — прочитай его полностью
2. **После каждой задачи** — проверь `npm run build` (backend) и `cd frontend && npm run build` (frontend)
3. **Не трогай** файлы документации (SPEC.md, README.md и т.д.) — они уже актуализированы
4. **Стиль кода** — TypeScript, строгая типизация, без `any` где возможно
5. **Не хардкодь секреты** — всё через `process.env`
6. **Новые npm пакеты** — устанавливать с exact version (`npm install package@version`)
7. **Prisma миграции** — после каждого изменения schema.prisma запускать `npx prisma migrate dev --name описание`
8. **Каждая задача** — один логический коммит с понятным сообщением
