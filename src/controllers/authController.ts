import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, generateToken, generateSlug, comparePassword } from '../utils/auth';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const slug = generateSlug(name);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        slug
      }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      slug: user.slug
    });

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        slug: user.slug,
        bookingMode: user.bookingMode
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
            isPublic: true
          }
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Неверные учетные данные' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Неверные учетные данные' });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      slug: user.slug
    });

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        slug: user.slug,
        bookingMode: user.bookingMode,
        services: user.services
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // User is already attached to req by auth middleware
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Fetch full user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
            isPublic: true
          }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        slug: userData.slug,
        bookingMode: userData.bookingMode,
        services: userData.services
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};