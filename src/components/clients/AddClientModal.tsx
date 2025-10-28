import React, { useState } from 'react';
import type { NewClient } from '../../api/clients';
import type { Client } from '../../types/database';
import ClientForm from './ClientForm';
import { X } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (client: NewClient) => void;
  userId: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd,
  userId
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleAdd = async (data: NewClient | Partial<Client>) => {
    try {
      setIsSaving(true);
      // Here we would typically call an API to create the client
      // For now, we'll just simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 100));
      // Ensure we're passing a complete NewClient object to onAdd
      const newClientData: NewClient = {
        user_id: userId, // Ensure user_id is included
        client_id: data.client_id || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        gender: data.gender || '',
        notes: data.notes || '',
        encrypted_notes: data.encrypted_notes || '',
        status: data.status || 'active',
      };
      onAdd(newClientData);
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
      // In a real app, we would show an error message to the user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <ClientForm
            onSubmit={handleAdd}
            onCancel={onClose}
            isLoading={isSaving}
            initialData={{ user_id: userId, status: 'active', client_id: '', first_name: '', last_name: '', notes: '', encrypted_notes: '', birth_date: '', gender: '', email: '', phone: '' } as Partial<Client>}
          />
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;