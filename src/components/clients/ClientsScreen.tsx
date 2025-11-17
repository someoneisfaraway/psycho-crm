import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Client, NewClient, UpdateClient } from '../../types/database';
import ClientsList from './ClientsList';
import AddClientModal from './AddClientModal';
import EditClientModal from './EditClientModal';
import DeleteClientModal from './DeleteClientModal';
import ClientDetails from './ClientDetails';


const ClientsScreen: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mock data for demonstration
  React.useEffect(() => {
    const mockClients: Client[] = [
      {
        id: '1',
        user_id: user?.id || '',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        age: 43,
        location: 'New York',
        source: 'private',
        schedule: '1x/week',
        status: 'active',
        session_price: 100,
        payment_type: 'self-employed',
        need_receipt: true,
        format: 'online',
        total_sessions: 10,
        total_paid: 1000,
        debt: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        meeting_link: 'https://meet.example.com/john-doe'
      },
      {
        id: '2',
        user_id: user?.id || '',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        age: 33,
        location: 'Los Angeles',
        source: 'yasno',
        schedule: '1x/week',
        status: 'active',
        session_price: 120,
        payment_type: 'ip',
        need_receipt: false,
        format: 'offline',
        total_sessions: 5,
        total_paid: 600,
        debt: 0,
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z',
        meeting_link: 'https://meet.example.com/jane-smith'
      }
    ];

    setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 1000);
  }, [user?.id]);

  const handleAddClient = (newClient: NewClient) => {
    // In a real app, we would call an API to create the client
    const client: Client = {
      ...newClient,
      id: (clients.length + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: newClient.status || 'active'
    } as Client;
    
    setClients([...clients, client]);
  };

  const handleEditClient = (updatedClient: UpdateClient & { id: string }) => {
    // In a real app, we would call an API to update the client
    setClients(clients.map(client => 
      client.id === updatedClient.id ? { ...client, ...updatedClient } : client
    ));
    
    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient({ ...selectedClient, ...updatedClient });
    }
  };

  const handleDeleteClient = (clientToDelete: Client) => {
    // In a real app, we would call an API to delete the client
    setClients(clients.filter(client => client.id !== clientToDelete.id));
    
    if (selectedClient && selectedClient.id === clientToDelete.id) {
      setSelectedClient(null);
      setIsDetailsOpen(false);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          {/* Кнопка Add Client удалена по просьбе пользователя */}
        </div>
        
        <ClientsList
          clients={clients}
          loading={loading}
          error={null}
          onEditClient={(client: Client) => {
            setSelectedClient(client);
            setIsEditModalOpen(true);
          }}
          onDeleteClient={(client: Client) => {
            setSelectedClient(client);
            setIsDeleteModalOpen(true);
          }}
          onViewClientDetails={handleViewClientDetails}
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
