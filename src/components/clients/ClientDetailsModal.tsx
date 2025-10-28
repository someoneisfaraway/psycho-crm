import React from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { Calendar, Mail, Phone, User, Edit3, FileText, CreditCard, TrendingUp, X } from 'lucide-react';

interface ClientDetailsModalProps {
  client: Client;
  isOpen: boolean;
  onEdit: (client: Client) => void;
  onClose: () => void;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ 
  client, 
  isOpen, 
  onEdit, 
  onClose 
}) => {
  if (!isOpen) {
    return null;
  }

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
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">
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
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email || 'Not provided'}</p>
                  </div>
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
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-800 italic">Encrypted content - decryption not implemented in this view</p>
                  </div>
                </div>
              )}
            </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-indigo-60 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Total Sessions</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Completed Sessions</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Amount</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
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

export default ClientDetailsModal;