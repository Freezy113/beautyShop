import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const isTimeSlotAvailable = async (
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> => {
  const whereClause: any = {
    userId,
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } }
    ]
  };

  if (excludeAppointmentId) {
    whereClause.id = { not: excludeAppointmentId };
  }

  const conflictingAppointments = await prisma.appointment.count({
    where: whereClause
  });

  return conflictingAppointments === 0;
};