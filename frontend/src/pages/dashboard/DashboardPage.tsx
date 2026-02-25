import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Appointment, Service } from '../../types';
import { Calendar } from '../../components/common/Calendar';
import { Button } from '../../components/common/Button';

export const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      await masterApi.updateAppointment(id, { status });
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const filteredAppointments = selectedDate
    ? appointments.filter(appointment =>
        appointment.startTime.startsWith(selectedDate.toISOString().split('T')[0])
      )
    : appointments;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Кабинет мастера</h1>
          <p className="text-gray-600">Управляйте вашими записями</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Календарь */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Календарь</h2>
              <Calendar
                selectedDate={selectedDate}
                selectedTime=""
                onDateSelect={setSelectedDate}
                onTimeSelect={() => {}}
                appointments={appointments}
              />
            </div>
          </div>

          {/* Записи */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Записи {selectedDate && `на ${selectedDate.toLocaleDateString('ru-RU')}`}
                </h2>
                <Button onClick={loadAppointments} isLoading={isLoading} variant="secondary">
                  Обновить
                </Button>
              </div>

              {filteredAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {selectedDate ? 'Нет записей на эту дату' : 'Нет записей'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors
                        ${selectedAppointment?.id === appointment.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {appointment.clientName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.startTime.slice(11, 16)} - {appointment.endTime.slice(11, 16)}
                            {appointment.serviceName && ` • ${appointment.serviceName}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.clientPhone}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                            ${appointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : ''}
                            ${appointment.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {appointment.status === 'PENDING' && 'В ожидании'}
                            {appointment.status === 'CONFIRMED' && 'Подтверждена'}
                            {appointment.status === 'COMPLETED' && 'Завершена'}
                            {appointment.status === 'CANCELLED' && 'Отменена'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(appointment.startTime).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно управления записью */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Управление записью</h3>
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium text-gray-700">Клиент:</span>
                <p className="text-gray-900">{selectedAppointment.clientName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Телефон:</span>
                <p className="text-gray-900">{selectedAppointment.clientPhone}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Время:</span>
                <p className="text-gray-900">
                  {new Date(selectedAppointment.startTime).toLocaleString('ru-RU')}
                </p>
              </div>
              {selectedAppointment.serviceName && (
                <div>
                  <span className="font-medium text-gray-700">Услуга:</span>
                  <p className="text-gray-900">{selectedAppointment.serviceName}</p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {selectedAppointment.status === 'PENDING' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')}
                    className="flex-1"
                  >
                    Подтвердить
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                    className="flex-1"
                  >
                    Отменить
                  </Button>
                </>
              )}
              {selectedAppointment.status === 'CONFIRMED' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'COMPLETED')}
                    className="flex-1"
                  >
                    Завершить
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedAppointment(null)}
                    className="flex-1"
                  >
                    Закрыть
                  </Button>
                </>
              )}
              {selectedAppointment.status === 'COMPLETED' && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full"
                >
                  Закрыть
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};