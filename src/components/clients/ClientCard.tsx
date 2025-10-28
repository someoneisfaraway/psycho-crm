import React from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { Calendar, Mail, Phone, User } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-full">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {client.first_name} {client.last_name}
              </h3>
              <p className="text-sm text-gray-500">{client.client_id}</p>
            </div>
          </div>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            {client.email && (
              <>
                <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <span>{client.email}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            {client.phone && (
              <>
                <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <span>{client.phone}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            {client.birth_date && (
              <>
                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <span>{new Date(client.birth_date).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(client)}>
            View Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(client)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;