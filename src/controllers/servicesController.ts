import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, durationMin, isPublic } = req.body;

    const service = await prisma.service.create({
      data: {
        userId: req.user!.id,
        name,
        price,
        durationMin,
        isPublic: isPublic ?? true
      }
    });

    res.status(201).json({
      message: 'Услуга успешно создана',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, price, durationMin, isPublic } = req.body;

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name: name ?? existingService.name,
        price: price !== undefined ? price : existingService.price,
        durationMin: durationMin !== undefined ? durationMin : existingService.durationMin,
        isPublic: isPublic !== undefined ? isPublic : existingService.isPublic
      }
    });

    res.json({
      message: 'Услуга успешно обновлена',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      message: 'Услуга успешно удалена'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};