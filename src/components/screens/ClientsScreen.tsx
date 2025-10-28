import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Client, NewClient } from '../../types/database';
import ClientsList from '../clients/ClientsList';
import AddClientModal from '../clients/AddClientModal';
import EditClientModal from '../clients/EditClientModal';
import DeleteClientModal from '../clients/DeleteClientModal';
import ClientDetails from '../clients/ClientDetails';
import { Button } from '../ui/Button';
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

  // Mock data for demonstration
  React.useEffect(() => {
    const mockClients: Client[] = [
      {
        id: '1',
        user_id: user?.id || '',
        client_id: 'CLI001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        birth_date: '1980-01-15',
        gender: 'male',
        notes: 'Long-term client with anxiety issues',
        encrypted_notes: '',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        status: 'active'
      },
      {
        id: '2',
        user_id: user?.id || '',
        client_id: 'CLI002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        birth_date: '1990-05-20',
        gender: 'female',
        notes: 'New client seeking therapy for depression',
        encrypted_notes: '',
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z',
        status: 'active'
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

  const handleEditClient = (updatedClient: Client) => {
    // In a real app, we would call an API to update the client
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
    
    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient(updatedClient);
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
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
            <Button variant="outline" onClick={handleCloseDetails}>
              Close
            </Button>
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
          refetch={() => {}}
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