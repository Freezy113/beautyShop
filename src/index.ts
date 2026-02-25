import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import serviceRoutes from './routes/services';
import appointmentRoutes from './routes/appointments';
import clientRoutes from './routes/clients';
import expenseRoutes from './routes/expenses';
import statsRoutes from './routes/stats';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Prisma available globally (optional convenience)
app.locals.prisma = prisma;

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'BeautyShop backend is running',
    version: '1.0.0'
  });
});

// API endpoints info
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
    }
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Start server
app.listen(port, () => {
  console.log(`BeautyShop backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${port}/api`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (error) {
    console.error('Error during Prisma disconnect:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
