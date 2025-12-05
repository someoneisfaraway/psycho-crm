// src/pages/ClientsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientsApi } from "../api/clients"; // Импортируем API объект из существующего файла
import type { Client, NewClient, UpdateClient } from '../types/database'; // Импортируем типы
import ClientsList from '../components/clients/ClientsList'; // Путь может отличаться, если ты перемещал
import AddClientModal from '../components/clients/AddClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import DeleteClientModal from '../components/clients/DeleteClientModal';
import ViewClientDetailsModal from '../components/clients/ViewClientDetailsModal';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SearchInput } from '../components/ui/SearchInput';

  

const ClientsScreen: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // Состояния для поиска и фильтров

  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const routeState = location.state as { clientId?: string; openDetails?: boolean } | null;

  // Функция для загрузки клиентов с учётом поиска и фильтров
  const fetchClients = async () => {
    if (!user?.id) return; // Не загружаем, если нет пользователя

    setLoading(true);
    setError(null);
    try {
      const fetchedClients = await clientsApi.getAll(user.id);
      setClients(fetchedClients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load clients. Please try again later.');
      // В реальном приложении можно добавить уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  // Загружаем клиентов при монтировании
  useEffect(() => {
    fetchClients();
  }, [user?.id]);

  // Открываем детали клиента автоматически, если пришли со страницы сессии
  useEffect(() => {
    if (routeState?.clientId && clients.length > 0) {
      const found = clients.find(c => c.id === routeState.clientId);
      if (found) {
        setSelectedClient(found);
        setIsDetailsOpen(true);
      }
    }
  }, [routeState, clients]);

  // Функция для обновления фильтров
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter((client) => client.name.toLowerCase().includes(query));
  }, [clients, searchQuery]);

  // Функция для добавления клиента
  const handleAddClient = async (newClientData: NewClient) => {
    if (!user?.id) return; // Защита

    try {
      // Подготовим данные для создания, включая обязательные поля
      // id генерируется в api/clients.ts, если не предоставлен
      const clientToCreate: Omit<Client, 'total_sessions' | 'total_paid' | 'debt' | 'created_at' | 'updated_at'> & { user_id: string } = {
        ...newClientData,
        id: newClientData.id || `auto_${Date.now()}`, // Генерируем id если не предоставлен
        user_id: user.id, // Важно: передаём user_id
        // total_sessions, total_paid, debt, created_at, updated_at будут установлены БД/триггером
      };

      const createdClient = await clientsApi.createClient(clientToCreate);
      setClients(prevClients => [createdClient, ...prevClients]); // Добавляем в начало списка
      setIsAddModalOpen(false); // Закрываем модалку
    } catch (err) {
      console.error('Failed to add client:', err);
      // Обработка ошибки, например, отображение сообщения
      alert('Error adding client: ' + (err as Error).message);
    }
  };

  // Функция для редактирования клиента
  const handleEditClient = async (updatedClientData: UpdateClient & { id: string }) => {
    // id передаётся отдельно, остальные обновления в updates
    const { id, ...updates } = updatedClientData;

    try {
      const updatedClient = await clientsApi.updateClient(id, updates); // Передаём id и обновления отдельно

      // Обновляем список клиентов локально
      setClients(prevClients => prevClients.map(client => client.id === updatedClient.id ? updatedClient : client));

      // Если редактируется выбранный клиент в деталях, обновляем его там тоже
      if (selectedClient && selectedClient.id === updatedClient.id) {
        setSelectedClient(updatedClient);
      }

      setIsEditModalOpen(false); // Закрываем модалку редактирования
    } catch (err) {
      console.error('Failed to edit client:', err);
      // Обработка ошибки
      alert('Error updating client: ' + (err as Error).message);
    }
  };

  // Функция для удаления клиента
  const handleDeleteClient = async (clientToDelete: Client) => {
    try {
      await clientsApi.deleteClient(clientToDelete.id);
      setClients(prevClients => prevClients.filter(client => client.id !== clientToDelete.id));

      // Если удаляемый клиент был выбран, закрываем детали
      if (selectedClient && selectedClient.id === clientToDelete.id) {
        setSelectedClient(null);
        setIsDetailsOpen(false);
      }

      setIsDeleteModalOpen(false); // Закрываем модалку
    } catch (err) {
      console.error('Failed to delete client:', err);
      // Обработка ошибки
      alert('Error deleting client: ' + (err as Error).message);
    }
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedClient(null);
  };

  // Раньше детали клиента заменяли весь экран. Теперь используем модал поверх экрана.

  

  return (
    <div className="screen-container">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-end items-center mb-6 gap-4">
          {/* Заголовок перенесён в общий хедер макета */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-sm px-3 py-1 flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3 text-text-primary">Поиск</h2>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Начните вводить имя клиента..."
          />
        </div>

        {/* Здесь должен быть рендеринг списка клиентов и модалок */}
        <ClientsList
          clients={filteredClients}
          loading={loading}
          error={error}
          onViewClientDetails={handleViewClientDetails}
          onEditClient={(client) => { setSelectedClient(client); setIsEditModalOpen(true); }}
          onDeleteClient={(client) => { setSelectedClient(client); setIsDeleteModalOpen(true); }}
        />

        {/* Модалки */}
        <AddClientModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddClient}
          userId={user?.id || ''}
        />
        {selectedClient && (
          <ViewClientDetailsModal
            client={selectedClient}
            isOpen={isDetailsOpen}
            onClose={handleCloseDetails}
            onEdit={(client: Client) => {
              setSelectedClient(client);
              setIsEditModalOpen(true);
            }}
            onDelete={(client: Client) => {
              setSelectedClient(client);
              setIsDeleteModalOpen(true);
            }}
          />
        )}
        {selectedClient && (
          <EditClientModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            client={selectedClient}
            onSave={(updates) => handleEditClient(updates)}
          />
        )}
        {selectedClient && (
          <DeleteClientModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            client={selectedClient}
            onConfirm={() => handleDeleteClient(selectedClient)}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsScreen;
