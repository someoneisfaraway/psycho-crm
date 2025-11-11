// src/components/calendar/SessionDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, CheckCircle, Edit, Ban } from 'lucide-react';
import { decrypt, unlockWithPassword, isUnlocked } from '../../utils/encryption'; // Импортируем функции шифрования/дешифровки
import { useAuth } from '../../contexts/AuthContext';

interface SessionDetailModalProps {
  session: Session; // Данные сессии для отображения
  client: Client; // Данные клиента, связанного с сессией
  isOpen: boolean; // Открыт ли модал
  onClose: () => void; // Функция закрытия
  onEdit: (session: Session) => void; // Функция редактирования
  onMarkCompleted: (id: string) => void; // Функция отметки завершения
  onMarkPaid: (id: string, paymentMethod: string) => void; // Функция отметки оплаты
  onMarkReceiptSent: (id: string) => void; // Функция отметки отправки чека
  onUnmarkPaid: (id: string) => void; // Снять отметку оплаты
  onUnmarkReceiptSent: (id: string) => void; // Снять отметку отправки чека
  onMarkCancelled: (id: string) => void; // Новая функция для отмены сессии
  error?: string; // Ошибка операции для отображения
  isProcessing?: boolean; // Состояние обработки
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  client,
  isOpen,
  onClose,
  onEdit,
  onMarkCompleted,
  onMarkPaid,
  onMarkReceiptSent,
  onUnmarkPaid,
  onUnmarkReceiptSent,
  onMarkCancelled,
  error,
  isProcessing,
}) => {
  // Состояние для меню выбора способа оплаты
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [decryptedNote, setDecryptedNote] = useState<string>('');
  const [decryptionError, setDecryptionError] = useState<boolean>(false);
  const [unlockPassword, setUnlockPassword] = useState<string>('');
  // const [tempPaymentMethod, setTempPaymentMethod] = useState(session.payment_method || 'cash');

  // Обработчик кнопки "Отметить оплату" - показывает меню
  const handleShowPaymentMenu = () => {
    setShowPaymentMenu(true);
  };

  // Обработчик выбора способа оплаты
  const handleSelectPaymentMethod = (method: string) => {
    // Закрываем меню и сразу вызываем onMarkPaid
    setShowPaymentMenu(false);
    onMarkPaid(session.id, method); // Передаём ID и выбранный метод
  };


  if (!isOpen || !session || !client) {
    return null;
  }

  // Вспомогательные функции для форматирования
  const formatDateTime = (dateString: string) => format(parseISO(dateString), 'd MMMM yyyy в HH:mm', { locale: ru });
  const formatDate = (dateString: string) => format(parseISO(dateString), 'd MMMM yyyy', { locale: ru });

  // Псевдо-расшифровка заметки (в реальности должна быть реальная расшифровка с ключом)
  // 
  // Пока что, просто покажем зашифрованный текст или сообщение
  
    // \u0412\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u043c \u043f\u043e\u043f\u044b\u0442\u043a\u0443 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043e\u0432\u043a\u0438 \u043f\u0440\u0438 \u043e\u0442\u043a\u0440\u044b\u0442\u0438\u0438 \u043c\u043e\u0434\u0430\u043b\u0430, \u0435\u0441\u043b\u0438 \u043a\u043b\u044e\u0447 \u0443\u0436\u0435 \u0440\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d
  useEffect(() => {
    try {
      if (!session) return;
      if (isUnlocked(user?.id)) {
        if (session.note_encrypted) {
          const text = decrypt(session.note_encrypted);
          setDecryptedNote(text || '');
          setDecryptionError(!text);
        } else {
          setDecryptedNote('');
          setDecryptionError(false);
        }
      }
    } catch (_e) {
      setDecryptionError(true);
    }
  }, [session?.note_encrypted, user]);

    const handleUnlock = async () => {
    if (!user) return;
    if (!unlockPassword.trim()) return;
    const ok = await unlockWithPassword(user.id, unlockPassword.trim());
    if (ok) {
      if (session.note_encrypted) {
        const text = decrypt(session.note_encrypted);
        setDecryptedNote(text || '');
        setDecryptionError(!text);
      }
      setUnlockPassword('');
    } else {
      setDecryptionError(true);
    }
  };

  // Определение цвета бейджа статуса
  const statusBadgeColor = () => {
    switch (session.status) {
      case 'scheduled': return 'bg-status-info-bg text-status-info-text';
      case 'completed': return 'bg-status-success-bg text-status-success-text';
      case 'cancelled': return 'bg-status-neutral-bg text-status-neutral-text';
      default: return 'bg-status-neutral-bg text-status-neutral-text';
    }
  };

  // Определение цвета индикатора оплаты
  const paymentIndicatorColor = session.paid ? 'text-status-success-text' : 'text-status-warning-text';
  const receiptIndicatorColor = session.receipt_sent ? 'text-status-success-text' : 'text-status-warning-text';

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 text-text-primary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="modal-title">
              Сессия #{session.session_number} с {client.name}
            </h2>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Ошибка операции */}
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
                  <div className="mt-2 text-sm text-status-error-text">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(decryptionError || !isUnlocked(user?.id)) && (
            <div className="space-y-3 mb-4">
              <div className="card bg-status-error-bg border-status-error-border text-status-error-text">
                Не удалось расшифровать заметку. Введите пароль от аккаунта, чтобы разблокировать заметки на этом устройстве.
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="input input-bordered w-full"
                />
                <Button variant="secondary" onClick={handleUnlock}>Разблокировать</Button>
              </div>
              <div className="text-sm text-text-secondary">Ваш пароль используется только локально для получения ключа расшифровки.</div>
            </div>
          )}

          {/* Индикатор загрузки */}
          {isProcessing && (
            <div className="mb-4 flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
              <span className="text-sm text-text-secondary">Обработка...</span>
            </div>
          )}

          {/* Блок 1: Основная информация */}
          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Основная информация</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Дата и время:</span>
                <span className="font-medium text-text-primary">{formatDateTime(session.scheduled_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Длительность:</span>
                <span className="font-medium text-text-primary">{session.duration} минут</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Формат:</span>
                <span className="font-medium text-text-primary">{session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Статус:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeColor()}`}>
                  {session.status === 'scheduled' ? 'Запланирована' :
                   session.status === 'completed' ? 'Завершена' :
                   session.status === 'cancelled' ? 'Отменена' : session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Блок 2: Финансы */}
          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Финансы</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Стоимость:</span>
                <span className="font-medium text-text-primary">{session.price} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Оплачено:</span>
                <span className={paymentIndicatorColor}>
                  {session.paid ? '✓ Да' : '⚠ Нет'}
                </span>
              </div>
              {session.paid && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Дата оплаты:</span>
                  <span className="font-medium text-text-primary">{session.paid_at ? formatDate(session.paid_at) : 'Не указана'}</span>
                </div>
              )}
              {session.paid && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Чек отправлен:</span>
                  <span className={receiptIndicatorColor}>
                    {session.receipt_sent ? '✓ Да' : '⏰ Нет'}
                  </span>
                </div>
              )}
              {session.paid && session.receipt_sent && session.receipt_sent_at && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Дата отправки чека:</span>
                  <span className="font-medium text-text-primary">{formatDate(session.receipt_sent_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Блок 3: Информация о клиенте */}
          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Информация о клиенте</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Имя:</span>
                <span className="font-medium text-text-primary">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">ID клиента:</span>
                <span className="font-medium text-text-primary">{client.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Всего сессий:</span>
                <span className="font-medium text-text-primary">{client.total_sessions}</span>
              </div>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onClose();
                    navigate('/clients', { state: { clientId: client.id, openDetails: true } });
                  }}
                >
                  Открыть карточку клиента →
                </Button>
              </div>
            </div>
          </div>

          {/* Блок 4: Заметка о сессии */}
          {decryptedNote && (
            <div className="card bg-bg-secondary border-border-primary mb-4">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Заметка о сессии</h3>
              <p className="text-text-primary">
                {decryptedNote}
              </p>
            </div>
          )}

          {/* Действия */}
          <div className="flex flex-wrap gap-2 mt-6">
            {session.status === 'scheduled' && (
              <>
                <Button variant="primary" onClick={() => onMarkCompleted(session.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Отметить завершённой
                </Button>
                <Button variant="destructive" onClick={() => onMarkCancelled(session.id)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Отменить
                </Button>
              </>
            )}
            {session.status !== 'cancelled' && (
              <Button
                variant="secondary"
                onClick={() => { onClose(); setTimeout(() => onEdit(session), 0); }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}

            {/* Оплата / Чек */}
            {session.status !== 'cancelled' && (
              <>
                {!session.paid ? (
                  <>
                    <Button variant="primary" onClick={handleShowPaymentMenu}>
                      Отметить оплату
                    </Button>
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
                  <Button variant="secondary" onClick={() => onUnmarkPaid(session.id)}>
                    Снять оплату
                  </Button>
                )}

                {session.paid && (
                  !session.receipt_sent ? (
                    <Button variant="primary" onClick={() => onMarkReceiptSent(session.id)}>
                      Отправить чек
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => onUnmarkReceiptSent(session.id)}>
                      Снять чек
                    </Button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;


