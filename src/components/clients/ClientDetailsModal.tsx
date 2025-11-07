import React, { useState, useEffect } from 'react';
import type { Client } from '../../types/database';
import type { Session } from '../../types/database';

import { Mail, Phone, User, CreditCard, TrendingUp, X, MapPin, Wallet, Clock } from 'lucide-react';
import { decrypt } from '../../utils/encryption';
import { formatDate, pluralize } from '../../utils/formatting';
import { getSessionsByClient } from '../../api/sessions';
import { useAuth } from '../../contexts/AuthContext';

interface ClientDetailsModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ 
  client, 
  isOpen, 
  onClose 
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptedNotes, setDecryptedNotes] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);

  if (!isOpen) {
    return null;
  }

  useEffect(() => {
    if (isOpen && user) {
      loadClientSessions();
      loadDecryptedNotes();
    }
  }, [isOpen, client.id, user]);

  const loadClientSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const clientSessions = await getSessionsByClient(client.id);
      setSessions(clientSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDecryptedNotes = () => {
    if (client.notes_encrypted) {
      try {
        const decrypted = decrypt(client.notes_encrypted);
        setDecryptedNotes(decrypted);
      } catch (error) {
        console.error('Error decrypting notes:', error);
        setDecryptedNotes('[Ошибка расшифровки]');
      }
    } else {
      setDecryptedNotes('');
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

  const getPaymentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'self-employed': 'Самозанятый (чеки нужны)',
      'ip': 'ИП (чеки нужны)',
      'cash': 'Наличные (без чеков)',
      'platform': 'Через платформу'
    };
    return labels[type] || type;
  };

  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      'private': 'Частный',
      'yasno': 'Ясно',
      'zigmund': 'Зигмунд',
      'alter': 'Alter',
      'other': 'Другое'
    };
    return labels[source] || source;
  };

  const getClientTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'regular': 'Системный',
      'one-time': 'Разовый'
    };
    return labels[type] || type;
  };

  const totalSessions = sessions.length;
  const totalPaid = sessions.filter(s => s.paid).reduce((sum, s) => sum + (s.price || 0), 0);
  const debt = sessions.filter(s => s.status === 'completed' && !s.paid).reduce((sum, s) => sum + (s.price || 0), 0);
  const lastSession = sessions.length > 0 ? sessions.reduce((latest, session) => 
    new Date(session.scheduled_at) > new Date(latest.scheduled_at) ? session : latest
 ) : null;
  const nextSession = sessions.length > 0 ? sessions
    .filter(s => new Date(s.scheduled_at) > new Date() && s.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] || null : null;

  // Format client data
  const clientName = client.name || 'Без имени';
  const displaySessions = showAllSessions ? sessions : sessions.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{clientName}</h2>
                <p className="text-sm text-gray-500">ID: {client.id}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(client.status)}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {getSourceLabel(client.source)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-50 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Contact Information */}
          {(client.age || client.location || client.phone || client.email || client.telegram) && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Контакты</h3>
              
              <div className="space-y-3">
                {client.age && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Возраст</p>
                      <p className="font-medium">{client.age} {pluralize(client.age, 'год', 'года', 'лет')}</p>
                    </div>
                  </div>
                )}
                
                {client.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Место жительства</p>
                      <p className="font-medium">{client.location}</p>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Телефон</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                )}
                
                {client.telegram && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Telegram</p>
                      <p className="font-medium">{client.telegram}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Finance and Format */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Финансы и формат</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Wallet className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-50">Стоимость сессии</p>
                  <p className="font-medium">{client.session_price?.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Форма оплаты</p>
                  <p className="font-medium">{getPaymentTypeLabel(client.payment_type)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  {client.format === 'online' ? '💻' : '🏢'}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Формат</p>
                  <p className="font-medium">{client.format === 'online' ? 'Онлайн' : 'Офлайн'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  {client.need_receipt ? '✅' : '❌'}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Нужны чеки</p>
                  <p className="font-medium">{client.need_receipt ? 'Да' : 'Нет'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Статистика</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex items-center mb-1">
                  <TrendingUp className="h-5 w-5 text-indigo-60 mr-2" />
                  <p className="text-gray-500">Всего сессий</p>
                </div>
                <p className="text-xl font-bold">{totalSessions}</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex items-center mb-1">
                  <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-gray-500">Оплачено</p>
                </div>
                <p className="text-xl font-bold">{totalPaid.toLocaleString('ru-RU')} ₽</p>
              </div>
              
              {debt > 0 && (
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="flex items-center mb-1">
                    <CreditCard className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-gray-500">Задолженность</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">{debt.toLocaleString('ru-RU')} ₽</p>
                </div>
              )}
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex items-center mb-1">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-gray-500">Тип клиента</p>
                </div>
                <p className="text-base font-medium">{getClientTypeLabel(client.type)}</p>
              </div>
            
            {(client.created_at || lastSession || nextSession) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {client.created_at && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-500">Первая сессия</p>
                    <p className="font-medium">{formatDate(client.created_at, 'd MMMM yyyy', { locale: 'ru' as any })}</p>
                  </div>
                )}
                
                {lastSession && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-500">Последняя сессия</p>
                    <p className="font-medium">{formatDate(lastSession.scheduled_at, 'd MMMM yyyy', { locale: 'ru' as any })}</p>
                  </div>
                )}
                
                {nextSession && (
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-500">Следующая сессия</p>
                    <p className="font-medium">{formatDate(nextSession.scheduled_at, 'd MMMM yyyy', { locale: 'ru' as any })}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notes */}
          {client.notes_encrypted && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 Примечания</h3>
              
              {decryptedNotes ? (
                <div className="bg-white p-3 rounded border whitespace-pre-wrap text-gray-800">
                  {decryptedNotes}
                </div>
              ) : (
                <p className="text-gray-500 italic">Примечаний нет</p>
              )}
            </div>
          )}
          
          {/* Session History */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              История сессий ({totalSessions})
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-gray-500 italic">Сессий пока нет</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {displaySessions.map(session => (
                  <div key={session.id} className="bg-white p-3 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">Сессия #{session.session_number}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.scheduled_at, 'd MMMM, HH:mm', { locale: 'ru' as any })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'completed' ? 'Завершена' : 'Запланирована'}
                      </span>
                    </div>
                    
                    {session.status === 'completed' && (
                      <div className="flex gap-2 text-sm mt-2">
                        {session.paid ? (
                          <span className="text-green-600">✅ Оплачено ({session.payment_method || 'Не указано'})</span>
                        ) : (
                          <span className="text-amber-600">⚠ Не оплачено</span>
                        )}
                        
                        {session.paid && session.receipt_sent && (
                          <span className="text-gray-600">• ✉ Чек отправлен</span>
                        )}
                      </div>
                    )}
                    
                    {session.price && (
                      <p className="text-sm text-gray-700 mt-2">💰 {session.price} ₽</p>
                    )}
                  </div>
                ))}
                
                {sessions.length > 10 && !showAllSessions && (
                  <button
                    onClick={() => setShowAllSessions(true)}
                    className="w-full py-2 text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Показать все {sessions.length} сессий
                  </button>
                )}
              </div>
            )}
          </div>
          
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;