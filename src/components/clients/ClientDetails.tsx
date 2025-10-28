// src/components/clients/ClientDetails.tsx
import React from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, User, Phone, Mail, MessageCircle, Calendar, CreditCard, Receipt, AlertTriangle, Edit, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация

interface ClientDetailsProps {
  client: Client;
  onEdit: (client: Client) => void; // Передаётся клиент для редактирования
  onClose: () => void; // Закрывает детальный вид
  onScheduleSession?: (clientId: string) => void; // Опционально, если вызывается из ClientsScreen
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onClose, onScheduleSession }) => {
  // Форматирование дат
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Не указана';
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
    } catch {
      return dateString; // Возврат исходной строки, если формат неверен
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Не указана';
    try {
      return format(new Date(dateString), 'd MMMM yyyy в HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Заголовок с именем и кнопками */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-500">ID: {client.id}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Блок 1: Идентификация */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Идентификация</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                client.status === 'active' ? 'bg-green-100 text-green-800' :
                client.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {client.status === 'active' ? 'Активный' : client.status === 'paused' ? 'На паузе' : 'Завершён'}
              </span>
              <span className="ml-2 text-gray-600 capitalize">{client.source}</span>
            </div>
          </div>
        </div>

        {/* Блок 2: Контакты */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Контакты</h2>
          <div className="space-y-2">
            {client.age && (
              <div className="flex items-center text-gray-600">
                <User className="mr-2 h-4 w-4" />
                <span>{client.age} лет</span>
              </div>
            )}
            {client.location && (
              <div className="flex items-center text-gray-600">
                <User className="mr-2 h-4 w-4" />
                <span>{client.location}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="mr-2 h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center text-gray-600">
                <Mail className="mr-2 h-4 w-4" />
                <span>{client.email}</span>
              </div>
            )}
            {client.telegram && (
              <div className="flex items-center text-gray-600">
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>{client.telegram}</span>
              </div>
            )}
          </div>
        </div>

        {/* Блок 3: Финансы и формат */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Финансы и формат</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Стоимость сессии:</span>
              <span className="font-medium">{client.session_price} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Форма оплаты:</span>
              <span className="capitalize">{client.payment_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Формат консультаций:</span>
              <span className="capitalize">{client.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Нужны ли чеки:</span>
              <span>{client.need_receipt ? 'Да' : 'Нет'}</span>
            </div>
          </div>
        </div>

        {/* Блок 4: Статистика */}
        <div className="bg-blue-50 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Всего сессий</p>
              <p className="text-xl font-bold">{client.total_sessions}</p>
            </div>
            <div>
              <p className="text-gray-600">Оплачено</p>
              <p className="text-xl font-bold">{client.total_paid} ₽</p>
            </div>
            <div>
              <p className="text-gray-600">Задолженность</p>
              <p className={`text-xl font-bold ${client.debt > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {client.debt > 0 && <AlertTriangle className="inline mr-1 h-4 w-4" />}
                {client.debt} ₽
              </p>
            </div>
            <div>
              <p className="text-gray-600">Первая сессия</p>
              <p className="text-gray-900">{formatDate(client.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-600">Последняя сессия</p>
              <p className="text-gray-900">{formatDate(client.last_session_at)}</p>
            </div>
            <div>
              <p className="text-gray-600">Следующая сессия</p>
              <p className="text-gray-900">{formatDateTime(client.next_session_at)}</p>
            </div>
          </div>
        </div>

        {/* Блок 5: Примечания (если есть) */}
        {client.notes_encrypted && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Примечания</h2>
            <p className="text-gray-600">
              {/* Заметки хранятся зашифрованными. Их нужно расшифровать перед отображением. */}
              {/* Псевдо-расшифровка для примера. В реальности нужен доступ к ключу. */}
              {/* Ниже показано место, где будет отображена расшифрованная заметка. */}
              {/* Для MVP, если ключ недоступен в этом компоненте, можно показать зашифрованный текст или сообщение. */}
              {/* Пока что, покажем зашифрованный текст. */}
              {/* В идеальной реализации, `client.notes_encrypted` был бы передан сюда уже расшифрованным или функция decrypt была бы доступна. */}
              {/* Псевдо-расшифровка: */}
              {/* {decrypt(client.notes_encrypted)} */}
              {/* Просто покажем зашифрованный текст: */}
              {client.notes_encrypted}
              {/* Или сообщение: */}
              {/* "Примечание зашифровано и не может быть отображено без ключа." */}
            </p>
          </div>
        )}

        {/* Блок 6: Действия */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button onClick={() => onScheduleSession && onScheduleSession(client.id)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Запланировать сессию
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;