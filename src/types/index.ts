import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    slug: string;
  };
}

export interface CreateServiceDto {
  name: string;
  price: number;
  durationMin: number;
  isPublic: boolean;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

export interface CreateAppointmentDto {
  serviceId?: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  endTime: Date;
  finalPrice?: number;
  notes?: string;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {
  status?: 'BOOKED' | 'COMPLETED' | 'CANCELED';
}

export interface CreateClientDto {
  name: string;
  phone: string;
  notes?: string;
}

export interface CreateExpenseDto {
  amount: number;
  description: string;
}

export interface StatsResponse {
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyStats: {
    month: string;
    appointments: number;
    revenue: number;
  }[];
}