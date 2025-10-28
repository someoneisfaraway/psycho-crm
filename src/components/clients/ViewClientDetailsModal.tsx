import React, { useState, useEffect } from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { Mail, Phone, User, Edit3, FileText, CreditCard, TrendingUp, X, MapPin } from 'lucide-react';
import { decrypt } from '../../utils/encryption';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ViewClientDetailsModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

const ViewClientDetailsModal: React.FC<ViewClientDetailsModalProps> = ({ 
  client, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState(false);

  if (!isOpen) {
    return null;
  }

  // Decrypt notes on component mount if notes_encrypted exist
  useEffect(() => {
    if (client.notes_encrypted) {
      try {
        const decrypted = decrypt(client.notes_encrypted);
        setDecryptedNotes(decrypted);
        setDecryptionError(false);
      } catch (error) {
        console.error('Decryption error:', error);
        setDecryptionError(true);
        setDecryptedNotes(null);
      }
    }
  }, [client.notes_encrypted]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const getAgeLabel = (age: number) => {
    const mod10 = age % 10;
    const mod100 = age % 100;
    
    if (mod10 === 1 && mod100 !== 11) {
      return 'год';
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return 'года';
    } else {
      return 'лет';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      private: 'Частный',
      yasno: 'Ясно',
      zigmund: 'Зигмунд',
      alter: 'Alter',
      other: 'Другое'
    };
    return labels[source] || source;
  };

  const getPaymentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'self-employed': 'Самозанятый (чеки нужны)',
      'ip': 'ИП (чеки нужны)',
      'cash': 'Наличные (без чеков)',
      'platform': 'Через платформу'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="client-details-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" role="document">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full" aria-hidden="true">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 id="client-details-title" className="text-xl font-bold text-gray-900">
                  {client.name}
                </h2>
                <p className="text-sm text-gray-500">ID: {client.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
              aria-label="Закрыть"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Identification section */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Идентификация</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                {client.status === 'active' ? 'Активный' : client.status === 'paused' ? 'На паузе' : 'Завершён'}
              </span>
            </div>
            <div className="flex gap-2 text-sm text-gray-700">
              <span>• {getSourceLabel(client.source)}</span>
              <span>• {client.type === 'regular' ? 'Системный' : 'Разовый'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contacts section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Контакты</h3>
              
              <div className="space-y-3">
                {client.age && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-gray-500">Возраст</p>
                      <p className="font-medium">{client.age} {getAgeLabel(client.age)}</p>
                    </div>
                  </div>
                )}
                
                {client.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-gray-500">Местоположение</p>
                      <p className="font-medium">{client.location}</p>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-gray-500">Телефон</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-gray-50">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                )}
                
                {client.telegram && (
                  <div className="flex items-center">
                    <div className="h-5 w-5 text-gray-400 mr-3 flex items-center justify-center" aria-hidden="true">💬</div>
                    <div>
                      <p className="text-sm text-gray-500">Telegram</p>
                      <p className="font-medium">{client.telegram}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Finance and Format section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Финансы и формат</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Стоимость сессии</p>
                    <p className="font-medium">{client.session_price?.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Форма оплаты</p>
                    <p className="font-medium">{getPaymentTypeLabel(client.payment_type)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-5 w-5 text-gray-400 mr-3 flex items-center justify-center" aria-hidden="true">
                    {client.format === 'online' ? '💻' : '🏢'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Формат</p>
                    <p className="font-medium">{client.format === 'online' ? 'Онлайн' : 'Офлайн'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics section */}
          <div className="p-4 bg-blue-50 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Статистика</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-white rounded shadow-sm">
                <p className="text-gray-600">Всего сессий</p>
                <p className="font-semibold text-lg">{client.total_sessions || 0}</p>
              </div>
              
              <div className="p-3 bg-white rounded shadow-sm">
                <p className="text-gray-600">Оплачено</p>
                <p className="font-semibold text-lg">{client.total_paid?.toLocaleString('ru-RU') || 0} ₽</p>
              </div>
              
              <div className="p-3 bg-white rounded shadow-sm">
                <p className="text-gray-600">Первая сессия</p>
                <p className="font-semibold">{client.created_at ? formatDate(client.created_at) : '—'}</p>
              </div>
              
              <div className="p-3 bg-white rounded shadow-sm">
                <p className="text-gray-600">Последняя сессия</p>
                <p className="font-semibold">{client.last_session_at ? formatDate(client.last_session_at) : '—'}</p>
              </div>
              
              {client.next_session_at && (
                <div className="col-span-2 md:col-span-4 p-3 bg-white rounded shadow-sm">
                  <p className="text-gray-600">Следующая сессия</p>
                  <p className="font-semibold">{formatDate(client.next_session_at)}</p>
                </div>
              )}
              
              {client.debt && client.debt > 0 && (
                <div className="col-span-2 md:col-span-4 p-3 bg-amber-100 rounded shadow-sm border border-amber-200">
                  <p className="text-gray-600">Задолженность</p>
                  <p className="font-bold text-lg text-amber-800">{client.debt.toLocaleString('ru-RU')} ₽</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Notes section */}
          {(client.notes_encrypted) && (
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 Примечания</h3>
              
              {client.notes_encrypted && (
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />
                    <p className="text-sm text-gray-500">Зашифрованные примечания</p>
                  </div>
                  
                  {decryptedNotes ? (
                    <div className="bg-white p-3 rounded border whitespace-pre-wrap text-gray-700">
                      {decryptedNotes}
                    </div>
                  ) : decryptionError ? (
                    <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700 text-sm">
                      Ошибка расшифровки примечаний
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-3 rounded text-gray-600 text-sm italic">
                      Примечания зашифрованы и будут отображены автоматически
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            <Button onClick={() => onEdit(client)}>
              <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
              Редактировать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClientDetailsModal;