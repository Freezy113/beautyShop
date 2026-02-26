import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Client } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', notes: '' });
  const [newClient, setNewClient] = useState({ name: '', phone: '', notes: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadClients(); }, []);

  useEffect(() => {
    const filtered = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
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
      await masterApi.createClient(newClient as any);
      await loadClients();
      setNewClient({ name: '', phone: '', notes: '' });
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
    setEditForm({ name: client.name, phone: client.phone, notes: client.notes || '' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({ name: '', phone: '', notes: '' });
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-sm text-gray-500 mt-1">Управление клиентской базой</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по имени или телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Клиенты
                <span className="text-sm font-normal text-gray-400 ml-2">{filteredClients.length}</span>
              </h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600" />
              )}
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-sm text-gray-400">
                  {clients.length === 0 ? 'Пока нет клиентов' : 'Ничего не найдено'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div key={client.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    {isEditing === client.id ? (
                      <form onSubmit={handleUpdateClient} className="space-y-3">
                        <Input label="Имя" type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} required />
                        <Input label="Телефон" type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} required />
                        <Input label="Заметки" type="text" value={editForm.notes} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} />
                        <div className="flex gap-2">
                          <Button type="submit" variant="primary" size="sm">Сохранить</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>Отмена</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{formatPhone(client.phone)}</div>
                            {client.notes && (
                              <div className="text-xs text-gray-400 mt-1 italic">{client.notes}</div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(client)}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Новый клиент</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <Input label="Имя" type="text" placeholder="Имя клиента" value={newClient.name} onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))} required />
              <Input label="Телефон" type="tel" placeholder="+7 (999) 123-45-67" value={newClient.phone} onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))} required />
              <Input label="Заметки" type="text" placeholder="Предпочтения, аллергии и т.д." value={newClient.notes} onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))} />
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={!newClient.name.trim() || !newClient.phone.trim()} className="w-full">
                Добавить клиента
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
