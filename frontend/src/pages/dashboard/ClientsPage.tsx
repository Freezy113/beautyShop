import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Client } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface ClientFormData extends Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {}

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [newClient, setNewClient] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getClients();
      setClients(response.data);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim() || !newClient.phone.trim()) return;

    setIsLoading(true);
    try {
      await masterApi.createClient(newClient);
      await loadClients();
      setNewClient({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
    } catch (error) {
      console.error('Ошибка создания клиента:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing || !editForm.name.trim()) return;

    setIsLoading(true);
    try {
      await masterApi.updateClient(isEditing, editForm);
      await loadClients();
      cancelEdit();
    } catch (error) {
      console.error('Ошибка обновления клиента:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (client: Client) => {
    setIsEditing(client.id);
    setEditForm({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      notes: client.notes || '',
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Клиенты</h1>
          <p className="text-gray-600">Управление клиентской базой</p>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Поиск по имени, телефону или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Список клиентов */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Клиенты ({filteredClients.length})
              </h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              )}
            </div>

            {filteredClients.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {clients.length === 0 ? 'Нет клиентов' : 'Нет результатов поиска'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div key={client.id} className="border border-gray-200 rounded-lg p-4">
                    {isEditing === client.id ? (
                      <form onSubmit={handleUpdateClient} className="space-y-4">
                        <Input
                          label="Имя"
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                        <Input
                          label="Телефон"
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                          label="Заметки"
                          type="text"
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
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
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-600">
                            {formatPhone(client.phone)}
                          </div>
                          {client.email && (
                            <div className="text-sm text-gray-500">{client.email}</div>
                          )}
                          {client.notes && (
                            <div className="text-sm text-gray-500 mt-2 italic">{client.notes}</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(client)}
                          size="sm"
                        >
                          Редактировать
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Создание нового клиента */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Новый клиент</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <Input
                label="Имя"
                type="text"
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                label="Телефон"
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="Заметки"
                type="text"
                value={newClient.notes}
                onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!newClient.name.trim() || !newClient.phone.trim()}
              >
                Создать клиента
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};