// src/components/clients/ClientDetails.tsx
import React, { useState } from 'react';
import type { Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, User, Phone, Mail, MessageCircle, Calendar, CreditCard, Receipt, AlertTriangle, Edit, PlusCircle, MoreVertical, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import { updateClient } from '../../api/clients'; // Импортируем функцию обновления

interface ClientDetailsProps {
  client: Client;
  onEdit: (client: Client) => void; // Передаётся клиент для редактирования
  onClose: () => void; // Закрывает детальный вид
  onScheduleSession?: (clientId: string) => void; // Опционально, если вызывается из ClientsScreen
  onClientUpdated?: (updatedClient: Client) => void; // Опционально, для обновления состояния в родителе
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onClose, onScheduleSession, onClientUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false); // Состояние для меню "ещё"

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

  // Функция для изменения статуса клиента на 'completed'
  const handleCompleteClient = async () => {
    if (window.confirm(`Вы уверены, что хотите завершить работу с клиентом ${client.name}? Это изменит статус на "Завершён".`)) {
      try {
        setIsUpdating(true);
        const updatedClientData = { ...client, status: 'completed' };
        const updatedClient = await updateClient(client.id, updatedClientData);
        // Обновляем локальное состояние
        onClientUpdated?.(updatedClient); // Если передана функция обновления родителя
        // Закрываем меню
        setShowMoreOptions(false);
      } catch (error) {
        console.error('Error completing client:', error);
        alert('Ошибка при завершении работы с клиентом: ' + (error as Error).message);
      } finally {
        setIsUpdating(false);
      }
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
            {/* Меню "ещё" для действий типа "Завершить работу" */}
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowMoreOptions(!showMoreOptions)}>
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMoreOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  {/* Кнопка "Завершить работу" видна только для активных и на паузе клиентов */}
                  {(client.status === 'active' || client.status === 'paused') && (
                    <button
                      onClick={handleCompleteClient}
                      disabled={isUpdating}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Завершить работу
                    </button>
                  )}
                  {/* Можно добавить другие действия, например, "Поставить на паузу" */}
                  {/* <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Поставить на паузу
                  </button> */}
                </div>
              )}
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
              {/* Псевдо-расшифровка: */}
              {client.notes_encrypted}
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