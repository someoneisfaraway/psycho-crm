// src/pages/ClientsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClients, createClient, updateClient, deleteClient, getClientById } from '../../api/clients'; // Импортируем функции из существующего файла
import type { Client, NewClient, UpdateClient } from '../../types/database'; // Импортируем типы
import ClientsList from '../components/clients/ClientsList'; // Путь может отличаться, если ты перемещал
import AddClientModal from '../components/clients/AddClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import DeleteClientModal from '../components/clients/DeleteClientModal';
import ClientDetails from '../components/clients/ClientDetails';
import { Button } from '../components/ui/Button'; // Путь может отличаться
import { Plus } from 'lucide-react';

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

  // Функция для загрузки клиентов
  const fetchClients = async () => {
    if (!user?.id) return; // Не загружаем, если нет пользователя

    setLoading(true);
    setError(null);
    try {
      const fetchedClients = await getClients(user.id);
      setClients(fetchedClients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load clients. Please try again later.');
      // В реальном приложении можно добавить уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  // Загружаем клиентов при монтировании и при изменении user.id
  useEffect(() => {
    fetchClients();
  }, [user?.id]);

  // Функция для добавления клиента
  const handleAddClient = async (newClientData: Omit<NewClient, 'user_id' | 'id' | 'total_sessions' | 'total_paid' | 'debt' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return; // Защита

    try {
      // Подготовим данные для создания, включая обязательные поля
      const clientToCreate: NewClient = {
        ...newClientData,
        user_id: user.id, // Важно: передаём user_id
        id: newClientData.id || `auto_${Date.now()}`, // Пример генерации ID, можно улучшить. Или пусть форма предоставляет.
        total_sessions: 0, // По умолчанию
        total_paid: 0,     // По умолчанию
        debt: 0,           // По умолчанию
        // created_at и updated_at будут установлены БД/триггером
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
  const handleEditClient = async (updatedClientData: UpdateClient) => {
    if (!updatedClientData.id) return; // Защита

    try {
      // Убираем user_id из обновления, если он там есть, так как его нельзя менять
      // Тип UpdateClient должен быть определен так, чтобы исключать id и user_id
      // const { user_id, id, ...updates } = updatedClientData; // Если user_id вдруг передаётся
      // const updatedClient = await updateClient(updatedClientData.id, updates);
      const updatedClient = await updateClient(updatedClientData.id, updatedClientData);

      setClients(prevClients => prevClients.map(client => client.id === updatedClient.id ? updatedClient : client));

      // Если редактируется выбранный клиент в деталях, обновляем его там тоже
      if (selectedClient && selectedClient.id === updatedClient.id) {
        setSelectedClient(updatedClient);
      }

      setIsEditModalOpen(false); // Закрываем модалку
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
            {/* Кнопка "Close" может быть не нужна, если детали открываются в модалке или отдельно */}
            {/* <Button variant="outline" onClick={handleCloseDetails}>
              Close
            </Button> */}
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