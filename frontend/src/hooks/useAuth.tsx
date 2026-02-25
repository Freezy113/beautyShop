import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; bookingMode: 'SERVICE_LIST' | 'TIME_SLOT' }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getCurrentUser()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (error) {
      throw new Error('Неверный email или пароль');
    }
  };

  const register = async (data: { email: string; password: string; name: string; bookingMode: 'SERVICE_LIST' | 'TIME_SLOT' }) => {
    try {
      const response = await authApi.register(data);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (error) {
      throw new Error('Ошибка регистрации');
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};