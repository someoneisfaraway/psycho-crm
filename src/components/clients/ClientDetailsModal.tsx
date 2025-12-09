import React, { useState, useEffect } from 'react';
import type { Client } from '../../types/database';
import type { Session } from '../../types/database';

import { Mail, Phone, User, CreditCard, TrendingUp, X, MapPin, Wallet, Clock, FileText, Calendar } from 'lucide-react';
import { decrypt, ENCRYPTION_EVENT } from '../../utils/encryption';
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
  const [decryptionError, setDecryptionError] = useState(false);
  // Локальных полей разблокировки больше нет — используем глобальную разлочку из настроек
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
    if (!client.notes_encrypted) {
      setDecryptedNotes('');
      setDecryptionError(false);
      return;
    }

    try {
      const decrypted = decrypt(client.notes_encrypted);
      if (!decrypted) {
        setDecryptionError(true);
        setDecryptedNotes('');
      } else {
        setDecryptionError(false);
        setDecryptedNotes(decrypted);
      }
    } catch (error) {
      console.error('Error decrypting notes:', error);
      setDecryptionError(true);
      setDecryptedNotes('');
    }
  };

  // Подписка на глобальное событие разлочки: обновим заметки при изменении состояния
  useEffect(() => {
    const handler = () => loadDecryptedNotes();
    if (typeof window !== 'undefined') {
      window.addEventListener(ENCRYPTION_EVENT, handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ENCRYPTION_EVENT, handler as EventListener);
      }
    };
  }, [client.notes_encrypted, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-status-success-bg text-status-success-text';
      case 'paused':
        return 'bg-status-warning-bg text-status-warning-text';
      case 'completed':
        return 'bg-status-neutral-bg text-status-neutral-text';
      default:
        return 'bg-status-neutral-bg text-status-neutral-text';
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
    return source === 'private' ? 'Личные' : source;
  };

  const getClientScheduleLabel = (schedule: string): string => {
    const labels: Record<string, string> = {
      '2x/week': '2х/нед',
      '1x/week': '1х/нед',
      '1x/2weeks': '1х/2нед',
      'flexible': 'Гибкое'
    };
    return labels[schedule] || schedule;
  };

  const totalSessions = sessions.length;
  const totalPaid = sessions.filter(s => s.paid).reduce((sum, s) => sum + (s.price || 0), 0);
  const debt = sessions.filter(s => s.status === 'completed' && !s.paid).reduce((sum, s) => sum + (s.price || 0), 0);
  const lastSession = sessions.length > 0 ? sessions.reduce((latest, session) => 
    new Date(session.scheduled_at) > new Date(latest.scheduled_at) ? session : latest
 ) : null;
  const nextSession = sessions.length > 0 ? (() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions
      .filter(s => new Date(s.scheduled_at).getTime() >= start.getTime() && s.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] || null;
  })() : null;

  // Format client data
  const clientName = client.name || 'Без имени';
  const displaySessions = showAllSessions ? sessions : sessions.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className="bg-primary-100 p-2 rounded-full">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h2 className="modal-title">{clientName}</h2>
                <p className="text-sm text-text-secondary">ID: {client.display_id}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(client.status)}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                  <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-1 rounded">
                    {getSourceLabel(client.source)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="modal-close-btn"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Contact Information */}
          {(client.age || client.location || client.phone || client.email || client.telegram) && (
            <div className="card mb-6">
              <div className="flex items-center mb-4">
                <Phone className="h-5 w-5 text-icon-secondary mr-2" />
                <h3 className="text-lg font-medium text-text-primary">Контакты</h3>
              </div>
              
              <div className="space-y-3">
                {client.age && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-icon-secondary mr-3" />
                    <div>
                      <p className="text-sm text-text-secondary">Возраст</p>
                      <p className="font-medium text-text-primary">{client.age} {pluralize(client.age, 'год', 'года', 'лет')}</p>
                    </div>
                  </div>
                )}
                
                {client.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-icon-secondary mr-3" />
                    <div>
                      <p className="text-sm text-text-secondary">Место жительства</p>
                      <p className="font-medium text-text-primary">{client.location}</p>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-icon-secondary mr-3" />
                    <div>
                      <p className="text-sm text-text-secondary">Телефон</p>
                      <p className="font-medium text-text-primary">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-icon-secondary mr-3" />
                    <div>
                      <p className="text-sm text-text-secondary">Email</p>
                      <p className="font-medium text-text-primary">{client.email}</p>
                    </div>
                  </div>
                )}
                
                {client.telegram && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-icon-secondary mr-3" />
                    <div>
                      <p className="text-sm text-text-secondary">Telegram</p>
                      <p className="font-medium text-text-primary">{client.telegram}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Finance and Format */}
          <div className="card mb-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-icon-secondary mr-2" />
              <h3 className="text-lg font-medium text-text-primary">Финансы и формат</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Wallet className="h-5 w-5 text-icon-secondary mr-3" />
                <div>
                  <p className="text-sm text-text-secondary">Стоимость сессии</p>
                  <p className="font-medium text-text-primary">{client.session_price?.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-icon-secondary mr-3" />
                <div>
                  <p className="text-sm text-text-secondary">Форма оплаты</p>
                  <p className="font-medium text-text-primary">{getPaymentTypeLabel(client.payment_type)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  {client.format === 'online' ? '💻' : '🏢'}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Формат</p>
                  <p className="font-medium text-text-primary">{client.format === 'online' ? 'Онлайн' : 'Офлайн'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  {client.need_receipt ? '✅' : '❌'}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Нужны чеки</p>
                  <p className="font-medium text-text-primary">{client.need_receipt ? 'Да' : 'Нет'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="card bg-status-info-bg border-status-info-border mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-icon-secondary mr-2" />
              <h3 className="text-lg font-medium text-text-primary">Статистика</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="card">
                <div className="flex items-center mb-1">
                  <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
                  <p className="text-text-secondary">Всего сессий</p>
                </div>
                <p className="text-xl font-bold text-text-primary">{totalSessions}</p>
              </div>
              
              <div className="card">
                <div className="flex items-center mb-1">
                  <CreditCard className="h-5 w-5 text-status-success-text mr-2" />
                  <p className="text-text-secondary">Оплачено</p>
                </div>
                <p className="text-xl font-bold text-text-primary">{totalPaid.toLocaleString('ru-RU')} ₽</p>
              </div>
              
              {debt > 0 && (
                <div className="card bg-status-warning-bg border-status-warning-border">
                  <div className="flex items-center mb-1">
                    <CreditCard className="h-5 w-5 text-status-warning-text mr-2" />
                    <p className="text-text-secondary">Задолженность</p>
                  </div>
                  <p className="text-xl font-bold text-status-warning-text">{debt.toLocaleString('ru-RU')} ₽</p>
                </div>
              )}
              
              <div className="card">
                <div className="flex items-center mb-1">
                  <Clock className="h-5 w-5 text-primary-600 mr-2" />
                  <p className="text-text-secondary">Расписание</p>
                </div>
                <p className="text-base font-medium text-text-primary">{getClientScheduleLabel((client as any).schedule)}</p>
              </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="card">
                <p className="text-text-secondary">Всего сессий</p>
                <p className="text-xl font-bold text-text-primary">{totalSessions}</p>
              </div>
              <div className="card">
                <p className="text-text-secondary">Следующая сессия</p>
                <p className="font-medium text-text-primary">{nextSession ? formatDate(nextSession.scheduled_at, 'd MMMM yyyy', { locale: 'ru' as any }) : '—'}</p>
              </div>
              <div className="card">
                <p className="text-text-secondary">Первая сессия</p>
                <p className="font-medium text-text-primary">{client.created_at ? formatDate(client.created_at, 'd MMMM yyyy', { locale: 'ru' as any }) : '—'}</p>
              </div>
              <div className="card">
                <p className="text-text-secondary">Последняя сессия</p>
                <p className="font-medium text-text-primary">{lastSession ? formatDate(lastSession.scheduled_at, 'd MMMM yyyy', { locale: 'ru' as any }) : '—'}</p>
              </div>
              <div className="card">
                <p className="text-text-secondary">Оплачено</p>
                <p className="text-xl font-bold text-text-primary">{totalPaid.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div className="card">
                <p className="text-text-secondary">Задолженность</p>
                <p className="text-xl font-bold text-text-primary">{debt.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {client.notes_encrypted && (
            <div className="card mb-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-icon-secondary mr-2" />
                <h3 className="text-lg font-medium text-text-primary">Примечания</h3>
              </div>
              
              {decryptedNotes ? (
                <div className="card bg-bg-secondary border-border-primary whitespace-pre-wrap text-text-primary">
                  {decryptedNotes}
                </div>
              ) : decryptionError ? (
                <div className="space-y-3">
                  <div className="card bg-status-error-bg border-status-error-border text-status-error-text">
                    Не удалось расшифровать примечания.
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary italic">Примечаний нет</p>
              )}
            </div>
          )}
          
          {/* Session History */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-icon-secondary mr-2" />
              <h3 className="text-lg font-medium text-text-primary">История сессий ({totalSessions})</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-text-secondary italic">Сессий пока нет</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {displaySessions.map(session => (
                  <div key={session.id} className="card border-border-primary">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-text-primary">Сессия #{session.session_number}</h4>
                        <p className="text-sm text-text-secondary">
                          {formatDate(session.scheduled_at, 'd MMMM, HH:mm', { locale: 'ru' as any })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'completed' ? 'bg-status-success-bg text-status-success-text' :
                        session.status === 'scheduled' ? 'bg-status-info-bg text-status-info-text' :
                        'bg-status-neutral-bg text-status-neutral-text'
                      }`}>
                        {session.status === 'completed' ? 'Завершена' : 'Запланирована'}
                      </span>
                    </div>
                    
                    {session.status === 'completed' && (
                      <div className="flex gap-2 text-sm mt-2">
                        {session.paid ? (
                          <span className="text-status-success-text">✅ Оплачено ({session.payment_method || 'Не указано'})</span>
                        ) : (
                          <span className="text-status-warning-text">⚠ Не оплачено</span>
                        )}
                        
                        {session.paid && session.receipt_sent && (
                          <span className="text-text-secondary">• ✉ Чек отправлен</span>
                        )}
                      </div>
                    )}
                    
                    {session.price && (
                      <p className="text-sm text-text-primary mt-2">💰 {session.price} ₽</p>
                    )}
                  </div>
                ))}
                
                {sessions.length > 10 && !showAllSessions && (
                  <button
                    onClick={() => setShowAllSessions(true)}
                    className="w-full py-2 text-center text-primary-600 hover:text-primary-800 font-medium text-sm"
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
