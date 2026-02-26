import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { MasterProfile, BookingData } from '../../types';
import { Calendar } from '../../components/common/Calendar';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [formData, setFormData] = useState({ clientName: '', clientPhone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadMasterProfile = async () => {
      if (!slug) return;
      try {
        const response = await publicApi.getMasterProfile(slug);
        setMasterProfile(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotFound(true);
        }
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setIsPageLoading(false);
      }
    };
    loadMasterProfile();
  }, [slug]);

  const getSelectedServiceData = () => {
    if (!selectedService || !masterProfile) return null;
    return masterProfile.services.find(s => s.id === selectedService);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) newErrors.clientName = 'Введите ваше имя';
    if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Введите номер телефона';
    if (!selectedDate) newErrors.date = 'Выберите дату';
    if (!selectedTime) newErrors.time = 'Выберите время';
    if (masterProfile?.bookingMode === 'SERVICE_LIST' && !selectedService) {
      newErrors.service = 'Выберите услугу';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !slug) return;

    setIsLoading(true);
    try {
      const service = getSelectedServiceData();
      const startTimeStr = `${selectedDate!.toISOString().split('T')[0]}T${selectedTime}:00`;

      const bookingData: BookingData = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        startTime: startTimeStr,
        ...(service && {
          serviceId: selectedService,
          endTime: new Date(new Date(startTimeStr).getTime() + service.durationMin * 60000).toISOString(),
        }),
        ...(!service && {
          endTime: new Date(new Date(startTimeStr).getTime() + 60 * 60000).toISOString(),
        }),
      };

      await publicApi.bookAppointment(slug, bookingData);
      setFormData({ clientName: '', clientPhone: '' });
      setSelectedService('');
      setSelectedTime('');
      setSuccessMessage('Вы успешно записаны! Мастер свяжется с вами для подтверждения.');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Ошибка создания записи';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600 mx-auto mb-4" />
          <p className="text-sm text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (notFound || !masterProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Мастер не найден</h2>
          <p className="text-sm text-gray-500">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Запись к мастеру
          </h1>
          <p className="text-lg text-primary-600 font-medium">{masterProfile.name}</p>
        </div>

        {successMessage && (
          <div className="mb-6">
            <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
          </div>
        )}

        {/* Services list */}
        {masterProfile.services.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Услуги</h2>
            <div className="space-y-2">
              {masterProfile.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{service.durationMin} мин</span>
                    <span className="font-semibold text-gray-900">{service.price} &#8381;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking form */}
        <form onSubmit={handleBook} className="space-y-6">
          {errors.general && (
            <Alert type="error" message={errors.general} onClose={() => setErrors(prev => ({ ...prev, general: '' }))} />
          )}

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Ваши данные</h2>
            <Input
              label="Имя"
              name="clientName"
              placeholder="Как к вам обращаться"
              value={formData.clientName}
              onChange={handleInputChange}
              error={errors.clientName}
              required
            />
            <Input
              label="Телефон"
              type="tel"
              name="clientPhone"
              placeholder="+7 (999) 123-45-67"
              value={formData.clientPhone}
              onChange={handleInputChange}
              error={errors.clientPhone}
              required
            />
          </div>

          {masterProfile.bookingMode === 'SERVICE_LIST' && masterProfile.services.length > 0 && (
            <div className="card">
              <Select
                label="Выберите услугу"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                placeholder="-- Выберите --"
                options={masterProfile.services.map(s => ({
                  value: s.id,
                  label: `${s.name} (${s.durationMin} мин, ${s.price} руб)`,
                }))}
                error={errors.service}
                required
              />
            </div>
          )}

          <Calendar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            appointments={masterProfile.appointments || []}
          />

          {(errors.date || errors.time) && (
            <Alert
              type="warning"
              message={[errors.date, errors.time].filter(Boolean).join('. ')}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Записаться
          </Button>
        </form>
      </div>
    </div>
  );
};
