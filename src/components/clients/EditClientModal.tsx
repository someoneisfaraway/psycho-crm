import React, { useState } from 'react';
import type { Client, UpdateClient } from '../../types/database';
import ClientForm from './ClientForm';
import { X } from 'lucide-react';

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ 
  client, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (data: UpdateClient) => {
    try {
      setIsSaving(true);
      // Here we would typically call an API to update the client
      // For now, we'll just simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, we would update the client with the returned data from the API
      onSave(client);
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
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
            <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <ClientForm
            initialData={client}
            onSubmit={handleSave}
            onCancel={onClose}
            isLoading={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;