import React, { useState } from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (client: Client) => void;
}

const DeleteClientModal: React.FC<DeleteClientModalProps> = ({ 
  client, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      // Here we would typically call an API to delete the client
      // For now, we'll just simulate the delete operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm(client);
      onClose();
    } catch (error) {
      console.error('Error deleting client:', error);
      // In a real app, we would show an error message to the user
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-40">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Удалить клиента</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Вы уверены, что хотите удалить этого клиента?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{client.name}</span> будет удалён без возможности восстановления.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Отменить
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              loading={isDeleting}
            >
              Удалить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;
