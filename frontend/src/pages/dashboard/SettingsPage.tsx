import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Service } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', durationMin: 30, price: 0, isPublic: true });
  const [isLoading, setIsLoading] = useState(false);
  const [newService, setNewService] = useState({ name: '', durationMin: 30, price: 0, isPublic: true });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getServices();
      setServices(response.data);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;
    setIsLoading(true);
    try {
      await masterApi.createService(newService as any);
      await loadServices();
      setNewService({ name: '', durationMin: 30, price: 0, isPublic: true });
      showSuccess('Услуга создана');
    } catch (error) {
      console.error('Ошибка создания услуги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing || !editForm.name.trim()) return;
    setIsLoading(true);
    try {
      await masterApi.updateService(isEditing, editForm);
      await loadServices();
      cancelEdit();
      showSuccess('Услуга обновлена');
    } catch (error) {
      console.error('Ошибка обновления услуги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Удалить эту услугу?')) return;
    setIsLoading(true);
    try {
      await masterApi.deleteService(id);
      await loadServices();
      showSuccess('Услуга удалена');
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (service: Service) => {
    setIsEditing(service.id);
    setEditForm({ name: service.name, durationMin: service.durationMin, price: service.price, isPublic: service.isPublic });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({ name: '', durationMin: 30, price: 0, isPublic: true });
  };

  const bookingLink = user?.slug ? `${window.location.origin}/book/${user.slug}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-sm text-gray-500 mt-1">Управление услугами и профилем</p>
        </div>

        {successMessage && (
          <div className="mb-6">
            <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
          </div>
        )}

        {/* Booking link */}
        {bookingLink && (
          <div className="card mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Ссылка для записи клиентов</h3>
                <p className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded-lg inline-block">{bookingLink}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigator.clipboard.writeText(bookingLink)}
              >
                Копировать
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Service list */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Услуги
                <span className="text-sm font-normal text-gray-400 ml-2">{services.length}</span>
              </h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600" />
              )}
            </div>

            {services.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm text-gray-400">Добавьте первую услугу</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    {isEditing === service.id ? (
                      <form onSubmit={handleUpdateService} className="space-y-3">
                        <Input
                          label="Название"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Длительность (мин)"
                            type="number"
                            value={editForm.durationMin}
                            onChange={(e) => setEditForm(prev => ({ ...prev, durationMin: parseInt(e.target.value) || 0 }))}
                            required
                          />
                          <Input
                            label="Цена (руб)"
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" variant="primary" size="sm">Сохранить</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>Отмена</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {service.durationMin} мин &middot; {service.price} &#8381;
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(service)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service.id)}>
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New service form */}
          <div className="card h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Новая услуга</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <Input
                label="Название услуги"
                type="text"
                placeholder="Например: Маникюр"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Длительность (мин)"
                  type="number"
                  value={newService.durationMin}
                  onChange={(e) => setNewService(prev => ({ ...prev, durationMin: parseInt(e.target.value) || 0 }))}
                  required
                />
                <Input
                  label="Цена (руб)"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!newService.name.trim()}
                className="w-full"
              >
                Добавить услугу
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
