// src/components/clients/ClientForm.tsx
import React, { useState, useEffect } from 'react';
import type { Client, NewClient } from '../../types/database'; // Обновим тип, чтобы он не включал id при создании, если генерируется
import { Button } from '../ui/Button';
import { Mail, Phone, User } from 'lucide-react';
import { encrypt } from '../../utils/encryption'; // Импортируем функцию шифрования

// Определим тип пропсов для формы
interface ClientFormProps {
  initialData?: Partial<Client>; // Данные для редактирования (необязательны)
  onSubmit: (data: NewClient) => void; // Функция для отправки данных. Для редактирования тип может быть UpdateClient
  onCancel: () => void; // Функция для отмены
  userId: string; // ID текущего пользователя (обязательно для создания)
  isLoading?: boolean;
}

// Тип для состояния формы
interface FormState extends Omit<NewClient, 'id' | 'user_id'> {
  idType: 'auto' | 'manual'; // Тип генерации ID
  manualId: string; // Поле для ручного ввода ID
  notes: string; // Нешифрованные заметки
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  userId,
  isLoading = false 
}) => {
  const isEditing = !!initialData?.id; // Проверяем, редактируем ли мы

  // Инициализируем состояние формы
  // При редактировании, initialData будет содержать id, source, type, и т.д.
  // При создании, initialData будет undefined или пустой объект.
  const [formData, setFormData] = useState<FormState>(() => {
    if (isEditing && initialData) {
      // Для редактирования: используем данные из initialData
      // idType будет 'manual', так как id уже задан
      // manualId будет равен initialData.id
      // notes нужно расшифровать, если initialData.notes_encrypted есть
      // Псевдо-расшифровка для примера, т.к. ключа нет
      const decryptedNotes = initialData.notes_encrypted ? initialData.notes_encrypted : ''; 
      return {
        idType: 'manual', // ID уже задан, значит, ручной ввод
        manualId: initialData.id, // Используем существующий id
        name: initialData.name || '',
        age: initialData.age || undefined,
        location: initialData.location || '',
        source: initialData.source || 'private',
        type: initialData.type || 'regular',
        phone: initialData.phone || '',
        email: initialData.email || '',
        telegram: initialData.telegram || '',
        session_price: initialData.session_price || 0,
        payment_type: initialData.payment_type || 'self-employed',
        need_receipt: initialData.need_receipt !== undefined ? initialData.need_receipt : true,
        format: initialData.format || 'online',
        meeting_link: initialData.meeting_link || '',
        notes: decryptedNotes, // Используем расшифрованные заметки
        status: initialData.status || 'active', // Статус при редактировании
        // Другие поля, если они есть в initialData
      };
    } else {
      // Для создания: начальные значения
      return {
        idType: 'auto', // По умолчанию автоматическая генерация
        manualId: '', // Пусто при автоматической генерации
        name: '',
        age: undefined,
        location: '',
        source: 'private',
        type: 'regular',
        phone: '',
        email: '',
        telegram: '',
        session_price: 0,
        payment_type: 'self-employed',
        need_receipt: true,
        format: 'online',
        meeting_link: '',
        notes: '',
        status: 'active', // Статус по умолчанию при создании
      };
    }
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    // Преобразование типов для числовых полей
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleIdTypeChange = (type: 'auto' | 'manual') => {
    setFormData(prev => ({
      ...prev,
      idType: type,
      // Если переключаемся на ручной ввод, оставляем текущее значение manualId, иначе очищаем
      // Если переключаемся на автоматический, очищаем manualId
      manualId: type === 'manual' ? prev.manualId : ''
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Имя обязательно и должно быть не короче 2 символов';
    }
    if (formData.idType === 'manual' && !formData.manualId) {
      newErrors.manualId = 'ID клиента обязателен при ручном вводе';
    }
    if (formData.session_price <= 0) {
      newErrors.session_price = 'Стоимость должна быть больше 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Подготовка данных для отправки
    // Если idType === 'auto', то id будет сгенерирован в API
    // Если idType === 'manual', используем formData.manualId
    let idForSubmission: string | undefined = undefined;
    if (formData.idType === 'manual' && formData.manualId) {
      idForSubmission = formData.manualId;
    }
    // В остальных случаях (auto или пустой manual при создании) id будет undefined,
    // и API его сгенерирует.

    const clientData: NewClient = {
      id: idForSubmission, // Может быть undefined для авто-генерации
      user_id: userId, // Передаём user_id из пропсов
      name: formData.name,
      age: formData.age || null, // Отправляем null, если не заполнено
      location: formData.location || null,
      source: formData.source,
      type: formData.type,
      phone: formData.phone || null,
      email: formData.email || null,
      telegram: formData.telegram || null,
      session_price: formData.session_price,
      payment_type: formData.payment_type,
      need_receipt: formData.need_receipt,
      format: formData.format,
      meeting_link: formData.meeting_link || null,
      notes_encrypted: formData.notes ? encrypt(formData.notes) : null, // Шифруем заметки перед отправкой
      status: formData.status, // Статус при создании по умолчанию 'active', при редактировании - переданный
      // Остальные поля (total_sessions, total_paid, debt, created_at, updated_at) будут установлены БД/триггером
    };

    onSubmit(clientData);
  };

  // Обновляем форму при изменении initialData (например, при переключении между созданием/редактированием)
  // useEffect(() => {
  //   if (isEditing && initialData) {
  //     // Логика обновления состояния при редактировании, если initialData меняется извне
  //     // Пока что форма инициализируется один раз при монтировании
  //   }
  // }, [initialData, isEditing]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Секция 1: Основная информация */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Основная информация</h3>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Имя *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID клиента
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="idType"
                  checked={formData.idType === 'auto'}
                  onChange={() => handleIdTypeChange('auto')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isEditing} // Нельзя менять тип ID при редактировании
                />
                <span className="ml-2">Автоматический (auto_123)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="idType"
                  checked={formData.idType === 'manual'}
                  onChange={() => handleIdTypeChange('manual')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isEditing} // Нельзя менять тип ID при редактировании
                />
                <span className="ml-2">Ручной ввод</span>
              </label>
            </div>
            {formData.idType === 'manual' && (
              <div className="mt-2">
                <input
                  type="text"
                  id="manualId"
                  name="manualId"
                  value={formData.manualId}
                  onChange={handleChange}
                  placeholder="yasno_123 или другое"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.manualId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isEditing} // Нельзя менять ID при редактировании
                />
                {errors.manualId && <p className="mt-1 text-sm text-red-600">{errors.manualId}</p>}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Возраст
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Место жительства
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Секция 2: Классификация */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Классификация</h3>
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Источник *
            </label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isEditing} // Предположим, source нельзя менять при редактировании
            >
              <option value="private">Частный клиент</option>
              <option value="yasno">Ясно</option>
              <option value="zigmund">Зигмунд</option>
              <option value="alter">Alter</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Тип клиента *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="regular">Системный (регулярные сессии)</option>
              <option value="one-time">Разовый</option>
            </select>
          </div>
        </div>

        {/* Секция 3: Контакты */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Контакты</h3>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Телефон
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
                placeholder="+7 (999) 123-45-67"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
                placeholder="client@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="telegram" className="block text-sm font-medium text-gray-700">
              Telegram
            </label>
            <input
              type="text"
              id="telegram"
              name="telegram"
              value={formData.telegram}
              onChange={handleChange}
              placeholder="@username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Секция 4: Финансы */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Финансы</h3>
          <div>
            <label htmlFor="session_price" className="block text-sm font-medium text-gray-700">
              Стоимость сессии *
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="session_price"
                name="session_price"
                value={formData.session_price}
                onChange={handleChange}
                className={`mt-1 block w-3/4 px-3 py-2 border ${errors.session_price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              <span className="ml-2 mt-3">₽</span>
            </div>
            {errors.session_price && <p className="mt-1 text-sm text-red-600">{errors.session_price}</p>}
          </div>

          <div>
            <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">
              Форма оплаты *
            </label>
            <select
              id="payment_type"
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="self-employed">Самозанятый (чеки нужны)</option>
              <option value="ip">ИП (чеки нужны)</option>
              <option value="cash">Наличные (без чеков)</option>
              <option value="platform">Через платформу</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="need_receipt"
              name="need_receipt"
              type="checkbox"
              checked={formData.need_receipt}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="need_receipt" className="ml-2 block text-sm text-gray-900">
              Нужны ли чеки клиенту
            </label>
          </div>
        </div>

        {/* Секция 5: Формат */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900">Формат</h3>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="format"
                value="online"
                checked={formData.format === 'online'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">Онлайн</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="format"
                value="offline"
                checked={formData.format === 'offline'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">Офлайн</span>
            </label>
          </div>
          {formData.format === 'online' && (
            <div className="mt-2">
              <label htmlFor="meeting_link" className="block text-sm font-medium text-gray-700">
                Постоянная ссылка на встречу (опционально)
              </label>
              <input
                type="url"
                id="meeting_link"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Секция 6: Примечания */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900">Примечания (опционально)</h3>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Запрос, особенности и т.д.
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Отменить
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {isEditing ? 'Сохранить' : 'Создать клиента'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;