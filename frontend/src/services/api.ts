import axios from 'axios';
import {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  MasterProfile,
  Appointment,
  Service,
  Client,
  Expense,
  StatsResponse,
  BookingData,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginData): Promise<{ data: AuthResponse }> =>
    api.post('/auth/login', data),

  register: (data: RegisterData): Promise<{ data: AuthResponse }> =>
    api.post('/auth/register', data),

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },

  getCurrentUser: (): Promise<{ data: User }> =>
    api.get('/auth/me'),
};

export const publicApi = {
  getMasterProfile: (slug: string): Promise<{ data: MasterProfile }> =>
    api.get(`/public/${slug}`),

  bookAppointment: (slug: string, data: BookingData): Promise<{ data: Appointment }> =>
    api.post(`/public/${slug}/book`, data),
};

export const masterApi = {
  getServices: (): Promise<{ data: Service[] }> =>
    api.get('/services'),

  createService: (data: Partial<Service>): Promise<{ data: Service }> =>
    api.post('/services', data),

  updateService: (id: string, data: Partial<Service>): Promise<{ data: Service }> =>
    api.put(`/services/${id}`, data),

  deleteService: (id: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/services/${id}`),

  getAppointments: (): Promise<{ data: Appointment[] }> =>
    api.get('/appointments'),

  updateAppointment: (id: string, data: Partial<Appointment>): Promise<{ data: Appointment }> =>
    api.put(`/appointments/${id}`, data),

  getClients: (): Promise<{ data: Client[] }> =>
    api.get('/clients'),

  createClient: (data: Partial<Client>): Promise<{ data: Client }> =>
    api.post('/clients', data),

  updateClient: (id: string, data: Partial<Client>): Promise<{ data: Client }> =>
    api.put(`/clients/${id}`, data),

  getExpenses: (): Promise<{ data: Expense[] }> =>
    api.get('/expenses'),

  createExpense: (data: Partial<Expense>): Promise<{ data: Expense }> =>
    api.post('/expenses', data),

  getStats: (): Promise<{ data: StatsResponse }> =>
    api.get('/stats'),
};

export default api;
