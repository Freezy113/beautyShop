import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'BeautyShop backend is running',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'BeautyShop API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Регистрация нового мастера',
        'POST /api/auth/login': 'Вход в систему'
      },
      public: {
        'GET /api/public/:slug': 'Получение данных мастера',
        'POST /api/public/:slug/book': 'Создание записи'
      },
      services: {
        'GET /api/services': 'Получение всех услуг',
        'POST /api/services': 'Создание новой услуги',
        'PUT /api/services/:id': 'Обновление услуги',
        'DELETE /api/services/:id': 'Удаление услуги'
      },
      appointments: {
        'GET /api/appointments': 'Получение всех записей',
        'PUT /api/appointments/:id': 'Обновление записи'
      },
      clients: {
        'GET /api/clients': 'Получение всех клиентов',
        'POST /api/clients': 'Создание клиента'
      },
      expenses: {
        'POST /api/expenses': 'Добавление расхода'
      },
      stats: {
        'GET /api/stats': 'Получение статистики'
      }
    },
    note: 'Для работы с реальными данными требуется настроить PostgreSQL базу данных'
  });
});

// Demo endpoints without database
app.get('/api/services', (req, res) => {
  res.json({
    message: 'Services endpoint - requires database setup',
    demo: 'This endpoint would return user services after authentication'
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    message: 'Registration endpoint - requires database setup',
    demo: 'This would create a new user with hashed password and unique slug'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    message: 'Login endpoint - requires database setup',
    demo: 'This would verify credentials and return JWT token'
  });
});

app.listen(port, () => {
  console.log(`BeautyShop backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});