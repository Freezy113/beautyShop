import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validation';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { user, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bookingMode: 'SERVICE_LIST' as 'SERVICE_LIST' | 'TIME_SLOT',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const bookingModeOptions = [
    { value: 'SERVICE_LIST', label: 'Выбор услуги + времени' },
    { value: 'TIME_SLOT', label: 'Только выбор времени' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'Имя обязательно';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bookingMode: formData.bookingMode,
      });
    } catch (error: any) {
      setErrors({ general: error.message || 'Ошибка регистрации' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">BeautyShop</h2>
          <p className="text-gray-600">Создайте свой аккаунт</p>
        </div>

        <form className="card space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <Input
            label="Имя"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <Input
            label="Пароль"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
          />

          <Input
            label="Подтвердите пароль"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            required
          />

          <Select
            label="Режим записи"
            name="bookingMode"
            value={formData.bookingMode}
            onChange={handleInputChange}
            options={bookingModeOptions}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Зарегистрироваться
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};