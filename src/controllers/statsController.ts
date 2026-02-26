import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, StatsResponse } from '../types';
import { subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      orderBy: { startTime: 'desc' }
    });

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate basic stats
    const totalAppointments = appointments.length;
    const totalRevenue = appointments.reduce((sum, appt) => sum + (appt.finalPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Calculate monthly stats for last 6 months
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthAppointments = appointments.filter(appt =>
        appt.startTime >= monthStart && appt.startTime < monthEnd
      );

      const monthlyRevenue = monthAppointments.reduce(
        (sum, appt) => sum + (appt.finalPrice || 0),
        0
      );

      monthlyStats.push({
        month: format(monthStart, 'yyyy-MM'),
        appointments: monthAppointments.length,
        revenue: monthlyRevenue
      });
    }

    const stats: StatsResponse = {
      totalAppointments,
      completedAppointments: appointments.length,
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};