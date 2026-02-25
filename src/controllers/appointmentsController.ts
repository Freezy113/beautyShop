import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isTimeSlotAvailable } from '../utils/auth';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const whereClause: any = {
      userId: req.user!.id
    };

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      whereClause.startTime = {
        gte: new Date(startDate as string)
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { serviceId, clientName, clientPhone, startTime, endTime, finalPrice, notes, status } = req.body;

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    // Check time availability if updating time
    if (startTime && endTime) {
      const isAvailable = await isTimeSlotAvailable(
        req.user!.id,
        new Date(startTime),
        new Date(endTime),
        id
      );
      if (!isAvailable) {
        return res.status(400).json({ error: 'Временной слот занят' });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        serviceId: serviceId !== undefined ? serviceId : existingAppointment.serviceId,
        clientName: clientName !== undefined ? clientName : existingAppointment.clientName,
        clientPhone: clientPhone !== undefined ? clientPhone : existingAppointment.clientPhone,
        startTime: startTime ? new Date(startTime) : existingAppointment.startTime,
        endTime: endTime ? new Date(endTime) : existingAppointment.endTime,
        finalPrice: finalPrice !== undefined ? finalPrice : existingAppointment.finalPrice,
        notes: notes !== undefined ? notes : existingAppointment.notes,
        status: status !== undefined ? status : existingAppointment.status
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });

    res.json({
      message: 'Запись успешно обновлена',
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};