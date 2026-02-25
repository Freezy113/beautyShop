// Типы для аутентификации
export interface User {
  id: string;
  email: string;
  name: string;
  bookingMode: 'SERVICE_LIST' | 'TIME_SLOT';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Типы для API
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
  bookingMode: 'SERVICE_LIST' | 'TIME_SLOT';
}

// Типы для мастера и услуг
export interface Service {
  id: string;
  name: string;
  durationMin: number; // в минутах
  price: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MasterProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  services: Service[];
  workingHours: {
    [key: string]: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
}

// Типы для записей
export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  serviceName?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface BookingData {
  clientName: string;
  clientPhone: string;
  startTime: string;
  serviceId?: string;
  endTime?: string;
}

// Типы для клиентов
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для расходов
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для статистики
export interface StatsResponse {
  totalAppointments: number;
  totalRevenue: number;
  monthlyStats: {
    month: string;
    appointments: number;
    revenue: number;
  }[];
  topServices: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
}

// Типы для формы валидации
export interface ValidationError {
  field: string;
  message: string;
}

// Типы для состояний загрузки
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}