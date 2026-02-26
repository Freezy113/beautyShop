import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Appointment } from '../../types';
import { Calendar } from '../../components/common/Calendar';
import { Button } from '../../components/common/Button';

const statusConfig: Record<string, { label: string; classes: string }> = {
  BOOKED: { label: 'Новая', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  CONFIRMED: { label: 'Подтверждена', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  COMPLETED: { label: 'Завершена', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  CANCELED: { label: 'Отменена', classes: 'bg-gray-50 text-gray-500 border border-gray-200' },
};

export const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadAppointments(); }, []);

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
    ? appointments.filter(a => a.startTime.startsWith(selectedDate.toISOString().split('T')[0]))
    : appointments;

  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Записи</h1>
            <p className="text-sm text-gray-500 mt-1">Управляйте вашими записями</p>
          </div>
          <Button onClick={loadAppointments} isLoading={isLoading} variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Обновить
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Calendar
              selectedDate={selectedDate}
              selectedTime=""
              onDateSelect={setSelectedDate}
              onTimeSelect={() => {}}
              appointments={appointments}
              showTimeSlots={false}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
              >
                Показать все записи
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate
                    ? `Записи на ${selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
                    : 'Все записи'
                  }
                </h2>
                <span className="text-sm text-gray-400">{sortedAppointments.length} записей</span>
              </div>

              {sortedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <p className="text-gray-400 text-sm">
                    {selectedDate ? 'Нет записей на эту дату' : 'Пока нет записей'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedAppointments.map((appointment) => {
                    const status = statusConfig[appointment.status] || statusConfig.BOOKED;
                    return (
                      <div
                        key={appointment.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-sm
                          ${selectedAppointment?.id === appointment.id
                            ? 'border-primary-300 bg-primary-50/50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200'
                          }
                        `}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">{appointment.clientName}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${status.classes}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {appointment.startTime.slice(11, 16)} - {appointment.endTime.slice(11, 16)}
                              </span>
                              {appointment.service && (
                                <span className="truncate">{appointment.service.name}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{appointment.clientPhone}</div>
                          </div>
                          <div className="text-xs text-gray-400 ml-3 flex-shrink-0">
                            {new Date(appointment.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppointment(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Управление записью</h3>
              <button onClick={() => setSelectedAppointment(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {selectedAppointment.clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedAppointment.clientName}</div>
                  <div className="text-sm text-gray-500">{selectedAppointment.clientPhone}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-0.5">Дата и время</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedAppointment.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    {', '}
                    {selectedAppointment.startTime.slice(11, 16)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-0.5">Статус</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${(statusConfig[selectedAppointment.status] || statusConfig.BOOKED).classes}`}>
                    {(statusConfig[selectedAppointment.status] || statusConfig.BOOKED).label}
                  </span>
                </div>
              </div>
              {selectedAppointment.service && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-0.5">Услуга</div>
                  <div className="text-sm font-medium text-gray-900">{selectedAppointment.service.name}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {selectedAppointment.status === 'BOOKED' && (
                <>
                  <Button variant="primary" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')} className="flex-1">
                    Подтвердить
                  </Button>
                  <Button variant="danger" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELED')} className="flex-1">
                    Отменить
                  </Button>
                </>
              )}
              {selectedAppointment.status === 'CONFIRMED' && (
                <>
                  <Button variant="primary" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'COMPLETED')} className="flex-1">
                    Завершить
                  </Button>
                  <Button variant="danger" onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELED')} className="flex-1">
                    Отменить
                  </Button>
                </>
              )}
              {(selectedAppointment.status === 'COMPLETED' || selectedAppointment.status === 'CANCELED') && (
                <Button variant="secondary" onClick={() => setSelectedAppointment(null)} className="w-full">
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
