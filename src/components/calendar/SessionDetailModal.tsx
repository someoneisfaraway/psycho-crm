// src/components/calendar/SessionDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { decrypt, ENCRYPTION_EVENT } from '../../utils/encryption';
import { useAuth } from '../../contexts/AuthContext';

interface SessionDetailModalProps {
  session: Session;
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (session: Session) => void;
  onReschedule: (session: Session) => void;
  onMarkCompleted: (id: string) => void;
  onMarkPaid: (id: string, paymentMethod: string) => void;
  onMarkReceiptSent: (id: string) => void;
  onUnmarkPaid: (id: string) => void;
  onUnmarkReceiptSent: (id: string) => void;
  onMarkCancelled: (id: string) => void;
  onDelete: (id: string) => void;
  onRevertToScheduled: (id: string) => void;
  error?: string;
  isProcessing?: boolean;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  client,
  isOpen,
  onClose,
  onEdit,
  onReschedule,
  onMarkCompleted,
  onMarkPaid,
  onMarkReceiptSent,
  onUnmarkPaid,
  onUnmarkReceiptSent,
  onMarkCancelled,
  onRevertToScheduled,
  error,
  isProcessing,
}) => {
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decryptedNote, setDecryptedNote] = useState<string>('');
  const [decryptionError, setDecryptionError] = useState<boolean>(false);

  const handleShowPaymentMenu = () => setShowPaymentMenu(true);
  const handleSelectPaymentMethod = (method: string) => { setShowPaymentMenu(false); onMarkPaid(session.id, method); };

  if (!isOpen || !session || !client) return null;

  const formatDateTime = (dateString: string) => format(parseISO(dateString), 'd MMMM yyyy в HH:mm', { locale: ru });
  const formatDate = (dateString: string) => format(parseISO(dateString), 'd MMMM yyyy', { locale: ru });

  useEffect(() => {
    try {
      if (!session) return;
      if (!session.note_encrypted) { setDecryptedNote(''); setDecryptionError(false); return; }
      const text = decrypt(session.note_encrypted);
      setDecryptedNote(text || '');
      setDecryptionError(!text);
    } catch (_e) {
      setDecryptionError(true);
      setDecryptedNote('');
    }
  }, [session?.note_encrypted, user?.id]);

  useEffect(() => {
    const handler = () => {
      if (!session?.note_encrypted) { setDecryptedNote(''); setDecryptionError(false); return; }
      try { const text = decrypt(session.note_encrypted); setDecryptedNote(text || ''); setDecryptionError(!text); }
      catch (_e) { setDecryptionError(true); setDecryptedNote(''); }
    };
    if (typeof window !== 'undefined') window.addEventListener(ENCRYPTION_EVENT, handler as EventListener);
    return () => { if (typeof window !== 'undefined') window.removeEventListener(ENCRYPTION_EVENT, handler as EventListener); };
  }, [session?.note_encrypted, user?.id]);

  
  const statusTextStyle = (): React.CSSProperties => {
    if (session.status === 'completed') return { color: '#48c053', fontWeight: 700 } as React.CSSProperties;
    if (session.status === 'cancelled') return { color: '#ff0000', fontWeight: 700 } as React.CSSProperties;
    return { fontWeight: 700 } as React.CSSProperties;
  };
  const paymentIndicatorColor = session.paid ? 'text-status-success-text' : 'text-status-warning-text';
  const receiptIndicatorColor = session.receipt_sent ? 'text-status-success-text' : 'text-status-warning-text';

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 text-text-primary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="modal-title">Сессия #{session.session_number} с {client.name}</h2>
            <button onClick={onClose} className="modal-close-btn" aria-label="Закрыть модальное окно"><X className="h-6 w-6" /></button>
          </div>

          {error && (
            <div className="mb-4 card bg-status-error-bg border-status-error-border">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-status-error-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-status-error-text">Ошибка</h3>
                  <div className="mt-2 text-sm text-status-error-text"><p>{error}</p></div>
                </div>
              </div>
            </div>
          )}

          {decryptionError && (
            <div className="space-y-3 mb-4">
              <div className="card bg-status-error-bg border-status-error-border text-status-error-text">
                Не удалось расшифровать заметку.
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="mb-4 flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
              <span className="text-sm text-text-secondary">Обработка...</span>
            </div>
          )}

          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Основная информация</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-text-secondary">Дата и время:</span><span className="font-medium text-text-primary">{formatDateTime(session.scheduled_at)}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Длительность:</span><span className="font-medium text-text-primary">{session.duration} минут</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Формат:</span><span className="font-medium text-text-primary">{session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Статус:</span><span className="text-xs" style={statusTextStyle()}>{session.status === 'scheduled' ? 'Запланирована' : session.status === 'completed' ? 'Завершена' : session.status === 'cancelled' ? 'Отменена' : session.status}</span></div>
              {session.status === 'scheduled' && session.meeting_link && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Ссылка на встречу:</span>
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 underline break-all">{session.meeting_link}</a>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Финансы</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-text-secondary">Стоимость:</span><span className="font-medium text-text-primary">{session.price} ₽</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Оплачено:</span><span className={paymentIndicatorColor}>{session.paid ? '✓ Да' : '⚠ Нет'}</span></div>
              {session.paid && (
                <div className="flex justify-between"><span className="text-text-secondary">Дата оплаты:</span><span className="font-medium text-text-primary">{session.paid_at ? formatDate(session.paid_at) : 'Не указана'}</span></div>
              )}
              {session.status !== 'cancelled' && session.paid && (
                <div className="flex justify-between"><span className="text-text-secondary">Чек отправлен:</span><span className={receiptIndicatorColor}>{session.receipt_sent ? '✓ Да' : '⏰ Нет'}</span></div>
              )}
              {session.status !== 'cancelled' && session.paid && session.receipt_sent && session.receipt_sent_at && (
                <div className="flex justify-between"><span className="text-text-secondary">Дата отправки чека:</span><span className="font-medium text-text-primary">{formatDate(session.receipt_sent_at)}</span></div>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Информация о клиенте</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-text-secondary">Имя:</span><span className="font-medium text-text-primary">{client.name}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">ID клиента:</span><span className="font-medium text-text-primary">{client.id}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Всего сессий:</span><span className="font-medium text-text-primary">{client.total_sessions}</span></div>
              <div>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => { onClose(); navigate('/clients', { state: { clientId: client.id, openDetails: true } }); }}>
                  Открыть карточку клиента →
                </Button>
              </div>
            </div>
          </div>

          {decryptedNote && (
            <div className="card bg-bg-secondary border-border-primary mb-4">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Заметка о сессии</h3>
              <p className="text-text-primary">{decryptedNote}</p>
            </div>
          )}

          <div className="space-y-3 mt-6">
            {session.status === 'scheduled' && (
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => onMarkCompleted(session.id)}>
                  Завершить
                </Button>
                <Button variant="secondary" onClick={() => onReschedule(session)}>
                  Перенести
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {session.status === 'scheduled' && (
                <Button variant="destructive" onClick={() => onMarkCancelled(session.id)}>
                  Отменить
                </Button>
              )}
              {session.status !== 'cancelled' && (
                <Button variant="secondary" onClick={() => { onClose(); setTimeout(() => onEdit(session), 0); }}>
                  Редактировать
                </Button>
              )}

              {session.status === 'cancelled' ? (
                session.paid ? (
                  <Button variant="secondary" onClick={() => onUnmarkPaid(session.id)}>Снять оплату</Button>
                ) : null
              ) : (
                !session.paid ? (
                  <>
                    <Button variant="primary" onClick={handleShowPaymentMenu}>Оплачено</Button>
                    {showPaymentMenu && (
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-text-secondary">Способ:</span>
                        <Button size="sm" variant="secondary" onClick={() => handleSelectPaymentMethod('cash')}>Наличные</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSelectPaymentMethod('card')}>Карта</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSelectPaymentMethod('platform')}>Платформа</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSelectPaymentMethod('transfer')}>Перевод</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => onUnmarkPaid(session.id)}>Снять оплату</Button>
                )
              )}

              {session.status !== 'cancelled' && session.paid && (
                !session.receipt_sent ? (
                  <Button variant="primary" onClick={() => onMarkReceiptSent(session.id)}>Отправить чек</Button>
                ) : (
                  <Button variant="secondary" onClick={() => onUnmarkReceiptSent(session.id)}>Снять чек</Button>
                )
              )}

              {session.status === 'completed' && (
                <Button variant="secondary" onClick={() => onRevertToScheduled(session.id)}>
                  Отменить завершение
                </Button>
              )}
              {session.status === 'cancelled' && (
                <Button variant="secondary" onClick={() => onRevertToScheduled(session.id)}>
                  Откатить отмену
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
