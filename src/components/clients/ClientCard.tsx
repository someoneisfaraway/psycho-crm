import React from 'react';
import type { Client } from '../../types/database';
import { Mail, Phone, User, MessageCircle } from 'lucide-react'

interface ClientCardProps {
  client: Client;
  displayId?: string;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  displayId,
  onViewDetails 
}) => {

  // Определяем один контакт для отображения: телефон -> email -> telegram
  const primaryContact = client.phone || client.email || client.telegram || '';
  const ContactIcon = client.phone ? Phone : client.email ? Mail : client.telegram ? MessageCircle : null;

  

  return (
    <div className="bg-white rounded-lg">
      <div className={'p-4 border border-gray-200 rounded-lg cursor-pointer bg-white'} onClick={() => onViewDetails(client)}>
        <div className="flex justify-between items-start">
          <div className="flex items-center min-w-0">
            <div className="bg-indigo-100 p-2 rounded-full">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4 min-w-0">
              <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                {client.name}
              </h3>
              <p className="text-sm text-gray-500">{displayId || client.id}</p>
            </div>
          </div>
          <span
            className="text-xs ml-2"
            style={{
              fontWeight: 700,
              color:
                client.status === 'active' ? '#48c053' :
                client.status === 'paused' ? '#c99b0e' :
                '#ff0000'
            }}
          >
            {client.status === 'completed' ? 'Завершен' : client.status === 'paused' ? 'Пауза' : 'Активный'}
          </span>
        </div>
        
        <div className="mt-2">
          <div className="flex items-center text-sm text-gray-500 min-h-[24px]">
            {ContactIcon && primaryContact ? (
              <>
                <ContactIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <span>{primaryContact}</span>
              </>
            ) : (
              <span className="text-gray-400 italic">Контакт не указан</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
