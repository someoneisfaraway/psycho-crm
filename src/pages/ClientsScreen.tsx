// src/pages/ClientsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClients, createClient, updateClient, deleteClient } from '../../api/clients'; // Импортируем функции из существующего файла
import type { Client, NewClient, UpdateClient } from '../../types/database'; // Импортируем типы
import ClientsList from '../components/clients/ClientsList'; // Путь может отличаться, если ты перемещал
import AddClientModal from '../components/clients/AddClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import DeleteClientModal from '../components/clients/DeleteClientModal';
import ClientDetails from '../components/clients/ClientDetails';
import { Button } from '../components/ui/Button'; // Путь может отличаться
import { Plus } from 'lucide-react';

// Интерфейс для состояния фильтров
interface FilterState {
  status: string; // 'all', 'active', 'paused', 'completed'
  source: string[];
  type: string[];
  debt: 'with_debt' | 'no_debt' | 'all';
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    source: [],
    type: [],
    debt: 'all'
  });

  // Функция для загрузки клиентов с учётом поиска и фильтров
  const fetchClients = async () => {
    if (!user?.id) return; // Не загружаем, если нет пользователя

    setLoading(true);
    setError(null);
    try {
      const options = {
        userId: user.id,
        searchTerm: searchTerm || undefined, // Передаём undefined, если пустая строка
        statusFilter: filters.status !== 'all' ? filters.status : undefined,
        sourceFilters: filters.source.length > 0 ? filters.source : undefined,
        typeFilters: filters.type.length > 0 ? filters.type : undefined,
        debtFilter: filters.debt
      };

      const fetchedClients = await getClients(options);
      setClients(fetchedClients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load clients. Please try again later.');
      // В реальном приложении можно добавить уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  // Загружаем клиентов при монтировании, при изменении user.id, searchTerm или filters
  useEffect(() => {
    fetchClients();
  }, [user?.id, searchTerm, filters]);

  // Функция для обновления фильтров
  const updateFilter = (filterName: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Функция для добавления клиента
  const handleAddClient = async (newClientData: Omit<NewClient, 'id' | 'total_sessions' | 'total_paid' | 'debt' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return; // Защита

    try {
      // Подготовим данные для создания, включая обязательные поля
      // id генерируется в api/clients.ts, если не предоставлен
      const clientToCreate = {
        ...newClientData,
        user_id: user.id, // Важно: передаём user_id
        // total_sessions, total_paid, debt, created_at, updated_at будут установлены БД/триггером
      };

      const createdClient = await createClient(clientToCreate);
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
      const updatedClient = await updateClient(id, updates); // Передаём id и обновления отдельно

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
      await deleteClient(clientToDelete.id);
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

  // Показываем детали, если isDetailsOpen и selectedClient установлены
  if (isDetailsOpen && selectedClient) {
    return (
      <ClientDetails
        client={selectedClient}
        onEdit={(client: Client) => {
          setSelectedClient(client);
          setIsEditModalOpen(true);
        }}
        onClose={handleCloseDetails}
        // Передаём функцию для обновления selectedClient и списка
        onClientUpdated={(updatedClient) => {
          // Обновляем selectedClient
          setSelectedClient(updatedClient);
          // Обновляем список клиентов в состоянии
          setClients(prevClients => prevClients.map(c => c.id === updatedClient.id ? updatedClient : c));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Поле поиска */}
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Блок фильтров */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Фильтр по статусу */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Фильтр по источнику (простой пример с чекбоксами) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <div className="space-y-1">
                {['private', 'yasno', 'zigmund', 'alter', 'other'].map(src => (
                  <label key={src} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.source.includes(src)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('source', [...filters.source, src]);
                        } else {
                          updateFilter('source', filters.source.filter(s => s !== src));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize">{src}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Фильтр по типу (простой пример с чекбоксами) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="space-y-1">
                {['regular', 'one-time'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('type', [...filters.type, type]);
                        } else {
                          updateFilter('type', filters.type.filter(t => t !== type));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Фильтр по задолженности */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debt</label>
              <select
                value={filters.debt}
                onChange={(e) => updateFilter('debt', e.target.value as 'with_debt' | 'no_debt' | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="with_debt">With Debt</option>
                <option value="no_debt">No Debt</option>
              </select>
            </div>
          </div>
        </div>

        <ClientsList
          clients={clients}
          loading={loading}
          error={error}
          onAddClient={() => setIsAddModalOpen(true)}
          onEditClient={(client: Client) => {
            setSelectedClient(client);
            setIsEditModalOpen(true);
          }}
          onDeleteClient={(client: Client) => {
            setSelectedClient(client);
            setIsDeleteModalOpen(true);
          }}
          onViewClientDetails={handleViewClientDetails}
          refetch={fetchClients} // Передаём функцию для обновления данных
        />
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddClient}
        userId={user?.id || ''}
      />

      {selectedClient && (
        <EditClientModal
          client={selectedClient}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditClient}
        />
      )}

      {selectedClient && (
        <DeleteClientModal
          client={selectedClient}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteClient}
        />
      )}
    </div>
  );
};

export default ClientsScreen;