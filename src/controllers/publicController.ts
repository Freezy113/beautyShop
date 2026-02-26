import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isTimeSlotAvailable } from '../utils/auth';

const prisma = new PrismaClient();

export const getMasterData = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        bookingMode: true,
        services: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true
          },
          orderBy: { createdAt: 'asc' }
        },
        appointments: {
          where: {
            status: { in: ['BOOKED', 'CONFIRMED'] },
            startTime: { gte: new Date() }
          },
          select: {
            id: true,
            startTime: true,
            endTime: true
          },
          orderBy: { startTime: 'asc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Мастер не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get master data error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { serviceId, clientName, clientPhone, startTime, endTime, finalPrice, notes } = req.body;

    // Find user by slug
    const user = await prisma.user.findUnique({ where: { slug } });
    if (!user) {
      return res.status(404).json({ error: 'Мастер не найден' });
    }

    // Validate time slot availability
    const isAvailable = await isTimeSlotAvailable(user.id, new Date(startTime), new Date(endTime));
    if (!isAvailable) {
      return res.status(400).json({ error: 'Временной слот занят' });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId: serviceId || null,
        clientName,
        clientPhone,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        finalPrice: finalPrice || null,
        notes: notes || null
      }
    });

    res.status(201).json({
      message: 'Запись успешно создана',
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};