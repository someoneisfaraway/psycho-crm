import React, { useState } from 'react';
import type { NewClient } from '../../api/clients';
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

  const handleAdd = async (data: NewClient) => {
    try {
      setIsSaving(true);
      // Here we would typically call an API to create the client
      // For now, we'll just simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onAdd(data);
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
            initialData={{ user_id: userId } as Partial<NewClient>}
          />
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;