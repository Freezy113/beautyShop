import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { MasterProfile, BookingData, Service } from '../../types';
import { Calendar } from '../../components/common/Calendar';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<{ startTime: string; endTime: string }[]>([]);

  useEffect(() => {
    const loadMasterProfile = async () => {
      if (!slug) return;
      try {
        const response = await publicApi.getMasterProfile(slug);
        setMasterProfile(response.data);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      }
    };

    loadMasterProfile();
  }, [slug]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Имя обязательно';
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Телефон обязателен';
    }

    if (!selectedDate) {
      newErrors.date = 'Выберите дату';
    }

    if (!selectedTime) {
      newErrors.time = 'Выберите время';
    }

    if (masterProfile?.bookingMode === 'SERVICE_LIST' && !selectedService) {
      newErrors.service = 'Выберите услугу';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!slug) return;

    setIsLoading(true);
    try {
      const bookingData: BookingData = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        startTime: `${selectedDate!.toISOString().split('T')[0]}T${selectedTime}:00`,
        ...(masterProfile?.bookingMode === 'SERVICE_LIST' && { serviceId: selectedService }),
      };

      await publicApi.bookAppointment(slug, bookingData);

      // Сброс формы после успешной записи
      setFormData({ clientName: '', clientPhone: '' });
      setSelectedService('');
      alert('Запись успешно создана!');
    } catch (error: any) {
      setErrors({ general: error.message || 'Ошибка создания записи' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!masterProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Запись к {masterProfile.name}
          </h1>
          <p className="text-gray-600">{masterProfile.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Информация о мастере */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Информация</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Телефон:</h3>
                <p className="text-gray-600">{masterProfile.phone || 'Не указан'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Адрес:</h3>
                <p className="text-gray-600">{masterProfile.address || 'Не указан'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Услуги:</h3>
                <ul className="mt-2 space-y-1">
                  {masterProfile.services.map((service) => (
                    <li key={service.id} className="text-gray-600">
                      {service.name} - {service.duration} мин - {service.price}₽
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Форма записи */}
          <form onSubmit={handleBook} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <Input
              label="Ваше имя"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              error={errors.clientName}
              required
            />

            <Input
              label="Телефон"
              type="tel"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleInputChange}
              error={errors.clientPhone}
              required
            />

            {masterProfile.bookingMode === 'SERVICE_LIST' && (
              <Select
                label="Выберите услугу"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                options={masterProfile.services.map(service => ({
                  value: service.id,
                  label: `${service.name} (${service.duration} мин)`,
                }))}
                error={errors.service}
              />
            )}

            <Calendar
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
              appointments={appointments}
            />

            {Object.keys(errors).some(key => key === 'date' || key === 'time') && (
              <div className="text-red-600 text-sm space-y-1">
                {errors.date && <p>• {errors.date}</p>}
                {errors.time && <p>• {errors.time}</p>}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Записаться
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};