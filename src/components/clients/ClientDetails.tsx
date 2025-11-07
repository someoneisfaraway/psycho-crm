// src/components/clients/ClientDetails.tsx
import React, { useState } from 'react';
import { Edit, User, Phone, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
// import { updateClient } from '../../api/clients'; // удалено: больше не используем завершение работы
import { formatDate } from '../../utils/formatting';
import { decrypt } from '../../utils/encryption';
import type { Client } from '../../types/database';

interface ClientDetailsProps {
  client: Client;
  onEdit: (client: Client) => void; // Передаётся клиент для редактирования
  onClose: () => void; // Закрывает детальный вид
  onScheduleSession?: (clientId: string) => void; // Опционально, если вызывается из ClientsScreen
  onClientUpdated?: (updatedClient: Client) => void; // Опционально, для обновления состояния в родителе
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onClose, onScheduleSession, onClientUpdated }) => {
  // Удалены локальные состояния и функции, связанные с завершением работы клиента

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Заголовок с именем без кнопок */}
        <div className="flex items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-500">ID: {client.id}</p>
          </div>
        </div>

        {/* Блок 1: Идентификация */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Идентификация</h2>
          <div className="flex items-center justify-start">
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
            {/* Кнопка "Завершить работу" удалена по требованиям */}
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
              <span className="font-medium text-gray-900">{client.session_price ?? '—'} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Форма оплаты:</span>
              <span className="capitalize text-gray-900">{client.payment_type ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Формат консультаций:</span>
              <span className="capitalize text-gray-900">{client.format ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Нужны ли чеки:</span>
              <span className="text-gray-900">{client.need_receipt ? 'Да' : client.need_receipt === false ? 'Нет' : '—'}</span>
            </div>
          </div>
        </div>

        {/* Блок 4: Статистика */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Всего сессий</p>
              <p className="text-xl font-bold text-gray-900">{client.total_sessions}</p>
            </div>
            <div>
              <p className="text-gray-600">Оплачено</p>
              <p className="text-xl font-bold text-gray-900">{client.total_paid} ₽</p>
            </div>
            <div>
              <p className="text-gray-600">Задолженность</p>
              <p className={`text-xl font-bold ${(client.debt ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {(client.debt ?? 0) > 0 && <AlertTriangle className="inline mr-1 h-4 w-4" />}
                {client.debt ?? 0} ₽
              </p>
            </div>
            <div>
              <p className="text-gray-600">Первая сессия</p>
              <p className="text-gray-900">{formatDate(client.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-600">Последняя сессия</p>
              <p className="text-gray-900">{client.last_session_at ? formatDate(client.last_session_at) : '—'}</p>
            </div>
            <div>
              <p className="text-gray-600">Следующая сессия</p>
              <p className="text-gray-900">{client.next_session_at ? formatDate(client.next_session_at, 'd MMMM yyyy, HH:mm') : 'Не указана'}</p>
            </div>
          </div>
        </div>

        {/* Блок 5: Примечания (если есть) */}
        {client.notes_encrypted && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Примечания</h2>
            <p className="text-gray-600 text-left">
              {/* Расшифровка заметки перед отображением */}
              {decrypt(client.notes_encrypted)}
            </p>
          </div>
        )}

        {/* Блок 6: Действия */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          {onScheduleSession && (
            <Button variant="default" onClick={() => onScheduleSession(client.id)}>
              Запланировать сессию
            </Button>
          )}
          <Button variant="default" onClick={() => onEdit(client)}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;