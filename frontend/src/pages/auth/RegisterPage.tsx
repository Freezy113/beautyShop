import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validation';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

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

  if (user) return <Navigate to="/dashboard" replace />;

  const bookingModeOptions = [
    { value: 'SERVICE_LIST', label: 'Выбор услуги + времени' },
    { value: 'TIME_SLOT', label: 'Только выбор времени' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!validateRequired(formData.name)) newErrors.name = 'Имя обязательно';
    if (!validateEmail(formData.email)) newErrors.email = 'Введите корректный email';
    if (!validatePassword(formData.password)) newErrors.password = 'Минимум 6 символов';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Создайте аккаунт</h2>
          <p className="text-gray-500 text-sm mt-1">Начните принимать онлайн-записи</p>
        </div>

        <form className="card space-y-5" onSubmit={handleSubmit}>
          {errors.general && (
            <Alert type="error" message={errors.general} onClose={() => setErrors(prev => ({ ...prev, general: '' }))} />
          )}

          <Input
            label="Ваше имя"
            type="text"
            name="name"
            placeholder="Анна Иванова"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <Input
            label="Пароль"
            type="password"
            name="password"
            placeholder="Минимум 6 символов"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
          />

          <Input
            label="Подтвердите пароль"
            type="password"
            name="confirmPassword"
            placeholder="Повторите пароль"
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

          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
            Зарегистрироваться
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};
