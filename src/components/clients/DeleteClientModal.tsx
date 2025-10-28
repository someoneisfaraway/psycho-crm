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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Delete Client</h2>
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
                Are you sure you want to delete this client?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{client.first_name} {client.last_name}</span> will be permanently deleted.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              loading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;