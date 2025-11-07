import React, { useState, useEffect } from 'react';
import type { Client } from '../../../types/database';
import ClientCard from '../ClientCard';

interface ClientsListProps {
  clients: Client[];
  loading: boolean;
  error: string | null;
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onViewClientDetails: (client: Client) => void;
  refetch?: () => Promise<void>;
}

const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  loading,
  error,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onViewClientDetails,
  // refetch,
}) => {
  // Убираем поиск и фильтрацию по строке, просто отображаем клиентов
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Удалена панель с поиском и кнопкой добавления */}

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Клиенты не найдены</h3>
          <p className="mt-1 text-sm text-gray-500">
            Начните с создания нового клиента.
          </p>
          {/* Кнопка «Добавить клиента» удалена по просьбе пользователя */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEditClient}
              onDelete={onDeleteClient}
              onViewDetails={onViewClientDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsList;