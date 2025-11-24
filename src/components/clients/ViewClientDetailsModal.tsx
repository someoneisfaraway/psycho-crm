import React, { useState, useEffect } from 'react';
import type { Client, Session } from '../../types/database';
import { Button } from '../ui/Button';
import { Mail, Phone, User, Edit3, FileText, CreditCard, X, MapPin } from 'lucide-react';
import { decrypt, ENCRYPTION_EVENT } from '../../utils/encryption';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getSessionsByClient } from '../../api/sessions';
import { useAuth } from '../../contexts/AuthContext';

interface ViewClientDetailsModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const ViewClientDetailsModal: React.FC<ViewClientDetailsModalProps> = ({ 
  client, 
  isOpen, 
  onClose, 
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState(false);
  // Локальных полей разблокировки больше нет — используем глобальную разлочку из настроек
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  if (!isOpen) {
    return null;
  }

  // Decrypt notes on component mount if notes_encrypted exist
  useEffect(() => {
    if (!client.notes_encrypted) {
      setDecryptedNotes(null);
      setDecryptionError(false);
      return;
    }
    try {
      const decrypted = decrypt(client.notes_encrypted);
      if (!decrypted) {
        setDecryptionError(true);
        setDecryptedNotes(null);
      } else {
        setDecryptedNotes(decrypted);
        setDecryptionError(false);
      }
    } catch (error) {
      console.error('Decryption error:', error);
      setDecryptionError(true);
      setDecryptedNotes(null);
    }
  }, [client.notes_encrypted, user?.id]);

  // Обновляем заметки при смене глобального состояния шифрования
  useEffect(() => {
    const handler = () => {
      if (client.notes_encrypted) {
        try {
          const decrypted = decrypt(client.notes_encrypted)
          setDecryptedNotes(decrypted || null)
          setDecryptionError(!decrypted)
        } catch (error) {
          console.error('Decryption error:', error)
          setDecryptedNotes(null)
          setDecryptionError(true)
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(ENCRYPTION_EVENT, handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ENCRYPTION_EVENT, handler as EventListener)
      }
    }
  }, [client.notes_encrypted, user?.id])

  // Load client's sessions and apply pagination
  useEffect(() => {
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const data = await getSessionsByClient(client.id);
        const sorted = (data || []).sort((a: Session, b: Session) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        );
        setSessions(sorted);
        setPage(1);
      } catch (err) {
        console.error('Error fetching client sessions:', err);
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [client.id]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const formatShort = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yy', { locale: ru });
    } catch {
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
        return 'bg-status-success-bg text-status-success-text';
      case 'paused':
        return 'bg-status-warning-bg text-status-warning-text';
      case 'completed':
        return 'bg-status-neutral-bg text-status-neutral-text';
      default:
        return 'bg-status-neutral-bg text-status-neutral-text';
    }
  };

  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      private: 'личный',
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

  const getClientScheduleLabel = (schedule: string): string => {
    const labels: Record<string, string> = {
      '2x/week': '2х/нед',
      '1x/week': '1х/нед',
      '1x/2weeks': '1х/2нед',
      'flexible': 'Гибкое'
    };
    return labels[schedule] || schedule;
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="client-details-title">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" role="document">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 id="client-details-title" className="text-2xl font-bold text-gray-900">
              Клиент: {client.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Identification section */}
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-text-primary">Идентификация</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                {client.status === 'active' ? 'Активный' : client.status === 'paused' ? 'На паузе' : 'Завершён'}
              </span>
            </div>
            <div className="flex gap-2 text-sm text-text-secondary">
              <span>• {getSourceLabel(client.source)}</span>
              <span>• {getClientScheduleLabel((client as any).schedule)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contacts section */}
            <div className="card">
              <h3 className="text-lg font-medium text-text-primary mb-4">Контакты</h3>
              
              <div className="space-y-3">
                {client.age && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-secondary">Возраст</p>
                      <p className="font-medium text-text-primary">{client.age} {getAgeLabel(client.age)}</p>
                    </div>
                  </div>
                )}
                
                {client.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-secondary">Местоположение</p>
                      <p className="font-medium text-text-primary">{client.location}</p>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-secondary">Телефон</p>
                      <p className="font-medium text-text-primary">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-secondary">Email</p>
                      <p className="font-medium text-text-primary">{client.email}</p>
                    </div>
                  </div>
                )}
                
                {client.telegram && (
                  <div className="flex items-center">
                    <div className="h-5 w-5 text-icon-secondary mr-3 flex items-center justify-center" aria-hidden="true">💬</div>
                    <div>
                      <p className="text-sm text-text-secondary">Telegram</p>
                      <p className="font-medium text-text-primary">{client.telegram}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Finance and Format section */}
            <div className="card">
              <h3 className="text-lg font-medium text-text-primary mb-4">Финансы и формат</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-text-secondary">Стоимость сессии</p>
                    <p className="font-medium text-text-primary">{client.session_price?.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-icon-secondary mr-3" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-text-secondary">Форма оплаты</p>
                    <p className="font-medium text-text-primary">{getPaymentTypeLabel(client.payment_type)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-5 w-5 text-icon-secondary mr-3 flex items-center justify-center" aria-hidden="true">
                    {client.format === 'online' ? '💻' : '🏢'}
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Формат</p>
                    <p className="font-medium text-text-primary">{client.format === 'online' ? 'Онлайн' : 'Офлайн'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics section */}
          <div className="card bg-status-info-bg border-status-info-border mb-6">
            <h3 className="text-lg font-medium text-text-primary mb-4">📊 Статистика</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="card">
                <p className="text-text-secondary">Всего сессий</p>
                <p className="font-semibold text-lg text-text-primary">{sessions.length}</p>
              </div>
              
              <div className="card">
                <p className="text-text-secondary">Оплачено</p>
                <p className="font-semibold text-lg text-text-primary">{sessions.filter(s => !!s.paid).reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('ru-RU')} ₽</p>
              </div>
              
              <div className="card">
                <p className="text-text-secondary">Первая сессия</p>
                <p className="font-semibold text-text-primary">{(() => {
                  const firstCompleted = sessions.filter(s => s.status === 'completed').sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
                  return firstCompleted ? formatDate(firstCompleted.scheduled_at) : '—';
                })()}</p>
              </div>
              
              <div className="card">
                <p className="text-text-secondary">Последняя сессия</p>
                <p className="font-semibold text-text-primary">{(() => {
                  const lastCompleted = sessions.filter(s => s.status === 'completed').sort((a,b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0];
                  return lastCompleted ? formatDate(lastCompleted.scheduled_at) : '—';
                })()}</p>
              </div>
              
              <div className="col-span-2 md:col-span-4 card">
                <p className="text-text-secondary">Следующая сессия</p>
                <p className="font-semibold text-text-primary">{(() => {
                  const now = new Date();
                  const nextScheduled = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now).sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
                  return nextScheduled ? format(new Date(nextScheduled.scheduled_at), 'd MMMM yyyy, HH:mm', { locale: ru }) : '—';
                })()}</p>
              </div>
              
              <div className="col-span-2 md:col-span-4 card">
                <p className="text-text-secondary">Задолженность</p>
                <p className="font-semibold text-lg text-text-primary">{sessions.filter(s => s.status === 'completed' && !s.paid).reduce((sum,s) => sum + (s.price || 0), 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>

          {/* Sessions section with pagination */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium text-text-primary mb-4">Сессии</h3>
            {sessionsLoading ? (
              <p className="text-text-secondary">Загрузка списка сессий…</p>
            ) : sessions.length === 0 ? (
              <p className="text-text-secondary">Сессий пока нет.</p>
            ) : (
              <>
                <ul className="divide-y divide-border-light">
                  {sessions
                    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    .map((session) => (
                      <li key={session.id} className="py-2 text-sm text-text-primary">
                        Сессия №{session.session_number} {formatShort(session.scheduled_at)} {session.status === 'completed' ? 'завершена' : session.status === 'scheduled' ? 'запланирована' : 'отменена'}
                      </li>
                    ))}
                </ul>
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-text-secondary">
                    Страница {page} из {Math.max(1, Math.ceil(sessions.length / PAGE_SIZE))}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(sessions.length / PAGE_SIZE)}
                    onClick={() => setPage((p) => Math.min(Math.ceil(sessions.length / PAGE_SIZE), p + 1))}
                  >
                    Далее
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Notes section */}
          {(client.notes_encrypted) && (
            <div className="card mb-6">
              <h3 className="text-lg font-medium text-text-primary mb-4">📝 Примечания</h3>
              
              {client.notes_encrypted && (
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />
                    <p className="text-sm text-gray-500">Зашифрованные примечания</p>
                  </div>
                  
                  {decryptedNotes ? (
                    <div className="card bg-bg-secondary border-border-primary whitespace-pre-wrap text-text-primary">
                      {decryptedNotes}
                    </div>
                  ) : decryptionError ? (
                    <div className="space-y-3">
                      <div className="card bg-status-error-bg border-status-error-border text-status-error-text text-sm">Не удалось расшифровать примечания.</div>
                    </div>
                  ) : (
                    <div className="card bg-bg-secondary text-text-secondary text-sm italic">
                      Примечания зашифрованы и будут отображены автоматически
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-border-primary">
            <Button variant="secondary" onClick={onClose}>Закрыть</Button>
            <Button variant="secondary" onClick={() => onEdit(client)}>
              <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
              Редактировать
            </Button>
            <Button variant="destructive" onClick={() => onDelete(client)}>Удалить</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClientDetailsModal;
