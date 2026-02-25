import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Service } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface ServiceFormData extends Omit<Service, 'id' | 'createdAt' | 'updatedAt'> {}

export const SettingsPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({
    name: '',
    durationMin: 30,
    price: 0,
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    durationMin: 30,
    price: 0,
    isPublic: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

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

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;

    setIsLoading(true);
    try {
      await masterApi.createService(newService);
      await loadServices();
      setNewService({
        name: '',
        durationMin: 30,
        price: 0,
        isPublic: true,
      });
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
    } catch (error) {
      console.error('Ошибка обновления услуги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) return;

    setIsLoading(true);
    try {
      await masterApi.deleteService(id);
      await loadServices();
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (service: Service) => {
    setIsEditing(service.id);
    setEditForm({
      name: service.name,
      durationMin: service.durationMin,
      price: service.price,
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({
      name: '',
      durationMin: 30,
      price: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки</h1>
          <p className="text-gray-600">Управление услугами</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Список услуг */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Услуги</h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              )}
            </div>

            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Нет услуг</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    {isEditing === service.id ? (
                      <form onSubmit={handleUpdateService} className="space-y-4">
                        <Input
                          label="Название услуги"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Длительность (мин)"
                            type="number"
                            value={editForm.durationMin}
                            onChange={(e) => setEditForm(prev => ({ ...prev, durationMin: parseInt(e.target.value) }))}
                            required
                          />
                          <Input
                            label="Цена (₽)"
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                            required
                          />
                        </div>
                        <Input
                          label="Описание"
                          type="text"
                          value={editForm.description}
                        />
                        <div className="flex space-x-3">
                          <Button type="submit" variant="primary">
                            Сохранить
                          </Button>
                          <Button type="button" variant="secondary" onClick={cancelEdit}>
                            Отмена
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-600">
                            {service.durationMin} мин • {service.price}₽
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => startEdit(service)}
                            size="sm"
                          >
                            Редактировать
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleDeleteService(service.id)}
                            size="sm"
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Создание новой услуги */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Новая услуга</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <Input
                label="Название услуги"
                type="text"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Длительность (мин)"
                  type="number"
                  value={newService.durationMin}
                  onChange={(e) => setNewService(prev => ({ ...prev, durationMin: parseInt(e.target.value) }))}
                  required
                />
                <Input
                  label="Цена (₽)"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  required
                />
              </div>
              <Input
                label="Описание"
                type="text"
                value={newService.description}
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!newService.name.trim()}
              >
                Создать услугу
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};