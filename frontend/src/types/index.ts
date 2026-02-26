export interface User {
  id: string;
  email: string;
  name: string;
  slug?: string;
  bookingMode: 'SERVICE_LIST' | 'TIME_SLOT';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
  bookingMode: 'SERVICE_LIST' | 'TIME_SLOT';
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MasterProfile {
  id: string;
  name: string;
  bookingMode: 'SERVICE_LIST' | 'TIME_SLOT';
  services: Service[];
  appointments: { id: string; startTime: string; endTime: string }[];
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  service?: { name: string; price: number; durationMin: number };
  startTime: string;
  endTime: string;
  status: 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  finalPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingData {
  clientName: string;
  clientPhone: string;
  startTime: string;
  endTime?: string;
  serviceId?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
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

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}
