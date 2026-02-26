# BeautyShop Frontend

Frontend для SaaS проекта BeautyShop, созданный на базе React 19, Vite 5 и TypeScript.

## Технологический стек

- **React 19** + **TypeScript**
- **Vite 5** для сборки и разработки
- **Tailwind CSS 3** (Mobile First)
- **React Router 6** для навигации
- **Axios** для API запросов

## Структура проекта

```
src/
├── components/          # Reusable компоненты
│   ├── common/         # Базовые компоненты (Button, Input, Select, Calendar)
│   └── ...
├── pages/              # Страницы приложения
│   ├── auth/          # Страницы аутентификации
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/     # Страницы кабинета мастера
│   │   ├── DashboardPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   └── StatsPage.tsx
│   └── public/        # Публичные страницы
│       └── BookingPage.tsx
├── hooks/             # Custom React Hooks
├── services/         # API сервисы
├── types/            # TypeScript типы
├── utils/            # Утилиты
└── ...
```

## Основные функции

### 1. Аутентификация
- Вход в систему (логин)
- Регистрация нового пользователя
- Хранение JWT токена в localStorage
- Автоматическое обновление токена

### 2. Публичная страница записи
- Профиль мастера с информацией
- Календарь для выбора даты и времени
- Два режима записи:
  - SERVICE_LIST: выбор услуги + времени
  - TIME_SLOT: только выбор времени
- Форма записи (Имя, Телефон)

### 3. Кабинет мастера
- **Календарь записей**: просмотр и управление записями
- **Настройки**: управление услугами (CRUD)
- **Клиенты**: управление клиентской базой с поиском
- **Расходы**: учет затрат и расходов
- **Статистика**: финансовая аналитика с графиками

## Запуск проекта

### Требования
- Node.js 18+
- npm или yarn

### Установка зависимостей
```bash
npm install
```

### Развитие (Development)
```bash
npm run dev
```

### Сборка (Production)
```bash
npm run build
```

### Предпросборка
```bash
npm run preview
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=BeautyShop
```

## API интеграция

Бэкенд BeautyShop доступен по адресу:
- URL: `http://localhost:3000/api`

Основные API эндпоинты реализованы в `src/services/api.ts`:
- Аутентификация: `/auth/login`, `/auth/register`
- Публичные: `/public/:slug`
- Мастерские: `/services`, `/appointments`, `/clients`, `/expenses`, `/stats`

## Особенности реализации

### 1. Mobile First дизайн
- Адаптивная верстка с Tailwind CSS
- Оптимизирована для мобильных устройств

### 2. Защита роутов
- `ProtectedRoute` компонент для защиты страниц кабинета
- Автоматический редирект на страницу входа

### 3. Валидация форм
- Клиентская валидация полей
- Интуитивные сообщения об ошибках

### 4. Управление состоянием
- React Context API для аутентификации
- Custom hooks для бизнес-логики

### 5. UX/UI улучшения
- Загрузочные состояния
- Анимации и переходы
- Адаптивное меню навигации

## Развертывание

Проект готов к развертыванию на любой платформе, поддерживающей статические файлы:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Для продакшена выполните:
```bash
npm run build
```
Сборка будет доступна в директории `dist/`.