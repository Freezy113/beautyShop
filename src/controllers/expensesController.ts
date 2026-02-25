import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;

    const expense = await prisma.expense.create({
      data: {
        userId: req.user!.id,
        amount,
        description
      }
    });

    res.status(201).json({
      message: 'Расход успешно добавлен',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};