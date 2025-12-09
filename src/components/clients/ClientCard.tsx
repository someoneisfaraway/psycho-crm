import React from 'react';
import type { Client } from '../../types/database';
import { Mail, Phone, MessageCircle } from 'lucide-react'

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
    <div>
      <div className={'p-3 border border-border-light rounded-lg hover:bg-background-hover cursor-pointer transition-colors'} onClick={() => onViewDetails(client)}>
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <div className="font-medium text-text-primary truncate">{client.name}</div>
            {displayId ? (
              <div className="font-medium text-text-primary">{`ID ${displayId}`}</div>
            ) : null}
          </div>
          <span className={`status-badge ${client.status === 'completed' ? 'status-success' : client.status === 'paused' ? 'status-neutral' : 'status-info'}`}>
            {client.status === 'completed' ? 'Завершен' : client.status === 'paused' ? 'Пауза' : 'Активный'}
          </span>
        </div>
        
        <div className="mt-2">
          <div className="flex items-center text-sm text-text-secondary min-h-[24px]">
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
