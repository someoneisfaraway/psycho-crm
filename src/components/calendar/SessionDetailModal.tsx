// src/components/calendar/SessionDetailModal.tsx
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, Calendar, Clock, User, CreditCard, Mail, CheckCircle, Edit, Send, Ban } from 'lucide-react';
import { decrypt } from '../../utils/encryption'; // Импортируем функцию расшифровки

interface SessionDetailModalProps {
  session: Session; // Данные сессии для отображения
  client: Client; // Данные клиента, связанного с сессией
  isOpen: boolean; // Открыт ли модал
  onClose: () => void; // Функция закрытия
  onEdit: (session: Session) => void; // Функция редактирования
  onMarkCompleted: (id: string) => void; // Функция отметки завершения
  onMarkPaid: (id: string, paymentMethod: string) => void; // Функция отметки оплаты
  onMarkReceiptSent: (id: string) => void; // Функция отметки отправки чека
  onReschedule: (session: Session) => void; // Функция переноса
  onForgiveDebt: (id: string) => void; // Функция списания долга
  onMarkCancelled: (id: string) => void; // Новая функция для отмены сессии
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
  onReschedule,
  onForgiveDebt,
  onMarkCancelled, // Новый пропс
}) => {
  // Состояние для меню выбора способа оплаты
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [tempPaymentMethod, setTempPaymentMethod] = useState(session.payment_method || 'cash');

  // Обработчик кнопки "Отметить оплату" - показывает меню
  const handleShowPaymentMenu = () => {
    setShowPaymentMenu(true);
  };

  // Обработчик выбора способа оплаты
  const handleSelectPaymentMethod = (method: string) => {
    setTempPaymentMethod(method);
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
  // const decryptedNote = session.note_encrypted ? decrypt(session.note_encrypted) : '';
  // Пока что, просто покажем зашифрованный текст или сообщение
  const decryptedNote = session.note_encrypted ? session.note_encrypted : '';

  // Определение цвета бейджа статуса
  const statusBadgeColor = () => {
    switch (session.status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Определение цвета индикатора оплаты
  const paymentIndicatorColor = session.paid ? 'text-green-600' : 'text-yellow-600';
  const receiptIndicatorColor = session.receipt_sent ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Сессия #{session.session_number} с {client.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Блок 1: Основная информация */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Основная информация</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Дата и время:</span>
                <span className="font-medium">{formatDateTime(session.scheduled_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Длительность:</span>
                <span className="font-medium">{session.duration} минут</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Формат:</span>
                <span className="font-medium">{session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeColor()}`}>
                  {session.status === 'scheduled' ? 'Запланирована' :
                   session.status === 'completed' ? 'Завершена' :
                   session.status === 'cancelled' ? 'Отменена' : session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Блок 2: Финансы */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Финансы</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Стоимость:</span>
                <span className="font-medium">{session.price} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Оплачено:</span>
                <span className={paymentIndicatorColor}>
                  {session.paid ? '✓ Да' : '⚠ Нет'}
                </span>
              </div>
              {session.paid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата оплаты:</span>
                  <span className="font-medium">{session.paid_at ? formatDate(session.paid_at) : 'Не указана'}</span>
                </div>
              )}
              {session.paid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Чек отправлен:</span>
                  <span className={receiptIndicatorColor}>
                    {session.receipt_sent ? '✓ Да' : '⏰ Нет'}
                  </span>
                </div>
              )}
              {session.paid && session.receipt_sent && session.receipt_sent_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата отправки чека:</span>
                  <span className="font-medium">{formatDate(session.receipt_sent_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Блок 3: Информация о клиенте */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Информация о клиенте</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Имя:</span>
                <span className="font-medium">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID клиента:</span>
                <span className="font-medium">{client.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Всего сессий:</span>
                <span className="font-medium">{client.total_sessions}</span>
              </div>
              <div>
                <Button variant="outline" size="sm" className="mt-2">
                  Открыть карточку клиента →
                </Button>
              </div>
            </div>
          </div>

          {/* Блок 4: Заметка о сессии */}
          {decryptedNote && (
            <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Заметка о сессии</h3>
              <p className="text-gray-600">
                {decryptedNote}
              </p>
            </div>
          )}

          {/* Действия */}
          <div className="flex flex-wrap gap-2 mt-6">
            {session.status === 'scheduled' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onMarkCompleted(session.id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Отметить завершённой
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onReschedule(session)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Перенести
                </Button>
                {/* Кнопка "Отменить" для реализации отмены сессии */}
                <Button
                  variant="destructive"
                  onClick={() => onMarkCancelled(session.id)} // Вызываем новую функцию
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Отменить
                </Button>
              </>
            )}
            {session.status === 'completed' && !session.paid && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={handleShowPaymentMenu} // Показываем меню выбора
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Отметить оплату
                </Button>
                {showPaymentMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    {['cash', 'card', 'platform', 'transfer'].map((method) => (
                      <button
                        key={method}
                        onClick={() => handleSelectPaymentMethod(method)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {method === 'cash' ? 'Наличные' :
                         method === 'card' ? 'Карта' :
                         method === 'platform' ? 'Через платформу' : 'Перевод'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {session.status === 'completed' && session.paid && !session.receipt_sent && (
              <Button
                variant="outline"
                onClick={() => onMarkReceiptSent(session.id)}
              >
                <Send className="mr-2 h-4 w-4" />
                Отправить чек
              </Button>
            )}
            {session.status === 'completed' && session.paid && session.receipt_sent && (
              <Button
                variant="outline"
                onClick={() => onEdit(session)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
            {session.status === 'completed' && session.paid && !session.receipt_sent && (
              <Button
                variant="outline"
                onClick={() => onEdit(session)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
            {session.status === 'completed' && session.paid && session.receipt_sent && (
              <Button
                variant="outline"
                onClick={() => onForgiveDebt(session.id)}
              >
                Списать долг
              </Button>
            )}
            {/* Кнопка "Редактировать" всегда видна, если статус не "cancelled" */}
            {session.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => onEdit(session)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;