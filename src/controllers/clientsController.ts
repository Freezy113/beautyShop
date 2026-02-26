import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: 'asc' }
    });

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, notes } = req.body;

    // Check if client with same phone already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: req.user!.id,
        phone
      }
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Клиент с таким номером телефона уже существует' });
    }

    const client = await prisma.client.create({
      data: {
        userId: req.user!.id,
        name,
        phone,
        notes: notes || null
      }
    });

    res.status(201).json({
      message: 'Клиент успешно создан',
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, phone, notes } = req.body;

    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    const client = await prisma.client.update({
      where: { id },
      data: { name, phone, notes: notes || null }
    });

    res.json({ message: 'Клиент успешно обновлён', client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};