// src/components/clients/ClientCard/index.tsx
import React from 'react';
import type { Client } from '../../../types/database';
import { Button } from '../../ui/Button';
import { User, Phone, Mail, MessageCircle, CreditCard, Receipt, AlertTriangle, Calendar, MapPin } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  // Функция для определения цвета статуса
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

  // Функция для определения цвета источника
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'private':
        return 'text-gray-600';
      case 'yasno':
        return 'text-purple-600';
      case 'zigmund':
        return 'text-blue-600';
      case 'alter':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Не указана';
    try {
      // Используем date-fns для форматирования, если установлен
      // import { format } from 'date-fns'; import { ru } from 'date-fns/locale';
      // return format(new Date(dateString), 'd MMM', { locale: ru });
      // Пока используем стандартный метод
      return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="px-4 py-5 sm:p-6">
        {/* Строка ID и статуса */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500">ID: {client.id}</p>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-1">
              {client.name}
            </h3>
          </div>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
            {client.status === 'active' ? 'Активный' :
             client.status === 'paused' ? 'На паузе' :
             'Завершён'}
          </span>
        </div>

        {/* Основная информация */}
        <div className="mt-4 space-y-1">
          {/* Статистика: сессии, последняя */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Сессий: {client.total_sessions}</span>
            <span>Последняя: {formatDate(client.last_session_at)}</span>
          </div>

          {/* Формат, стоимость, источник */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center">
              <CreditCard className="mr-1 h-3 w-3" />
              {client.payment_type === 'self-employed' ? 'Самозанятый' :
               client.payment_type === 'ip' ? 'ИП' :
               client.payment_type === 'cash' ? 'Наличные' :
               'Платформа'}
            </span>
            <span className="inline-flex items-center">
              <span className="mr-1">•</span>
              {client.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'}
            </span>
            <span className="inline-flex items-center">
              <span className="mr-1">•</span>
              <span className={getSourceColor(client.source)}>{client.source === 'private' ? 'Частный' : client.source}</span>
            </span>
            <span className="inline-flex items-center">
              <span className="mr-1">•</span>
              {client.session_price} ₽
            </span>
          </div>

          {/* Задолженность */}
          {client.debt && client.debt > 0 && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <AlertTriangle className="mr-1 h-4 w-4" />
              <span>Должник: {client.debt} ₽</span>
            </div>
          )}
        </div>

        {/* Контакты (опционально, можно свернуть или убрать, если карточка перегружена) */}
        {(client.phone || client.email || client.telegram) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {client.phone && (
                <div className="flex items-center">
                  <Phone className="mr-1 h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center">
                  <Mail className="mr-1 h-3 w-3" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.telegram && (
                <div className="flex items-center">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  <span>{client.telegram}</span>
                </div>
              )}
              {client.location && (
                <div className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3" />
                  <span>{client.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="mt-4 flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(client)}>
            Подробнее
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
            Редактировать
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;