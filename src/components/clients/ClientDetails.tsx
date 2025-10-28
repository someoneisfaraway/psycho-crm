import React, { useState } from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { Calendar, Mail, Phone, User, Edit3, FileText, X } from 'lucide-react';

interface ClientDetailsProps {
  client: Client;
  onEdit: (client: Client) => void;
 onClose: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onClose }) => {
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedNotes, setDecryptedNotes] = useState('');

  const handleDecryptNotes = () => {
    if (client.encrypted_notes && decryptionKey) {
      try {
        // In a real app, we would call an API to decrypt the notes
        // For now, we'll just simulate the decryption
        const decrypted = `Decrypted notes for ${client.first_name} ${client.last_name}`;
        setDecryptedNotes(decrypted);
      } catch (error) {
        console.error('Decryption error:', error);
        alert('Failed to decrypt notes. Please check your key.');
      }
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-90">
                  {client.first_name} {client.last_name}
                </h2>
                <p className="text-sm text-gray-500">{client.client_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{client.first_name} {client.last_name}</p>
                  </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email || 'Not provided'}</p>
                  </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{client.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p className="font-medium">{formatDate(client.birth_date)}</p>
                  </div>
                
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{client.gender || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">General Notes</p>
                <p className="font-medium">{client.notes || 'No notes provided'}</p>
              </div>
              
              {client.encrypted_notes && (
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-500">Encrypted Notes</p>
                  </div>
                  
                  {decryptedNotes ? (
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-800">{decryptedNotes}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={decryptionKey}
                        onChange={(e) => setDecryptionKey(e.target.value)}
                        placeholder="Enter decryption key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-50 focus:border-indigo-500"
                      />
                      <Button onClick={handleDecryptNotes} size="sm">
                        Decrypt Notes
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-indigo-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Total Sessions</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-green-60 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Completed Sessions</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Amount</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" onClick={() => onEdit(client)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;