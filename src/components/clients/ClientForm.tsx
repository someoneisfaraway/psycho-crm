// src/components/clients/ClientForm.tsx
import React, { useState } from 'react';
import type { Client, NewClient, UpdateClient } from '../../types/database'; // Обновим тип, чтобы он не включал id при создании, если генерируется
import { Button } from '../ui/Button';
import { Mail, Phone, Wallet } from 'lucide-react';
import { encrypt, decrypt } from '../../utils/encryption'; // Импортируем функции шифрования/расшифровки

// Определим тип пропсов для формы
interface ClientFormProps {
  initialData?: Partial<Client> & { notes?: string }; // Данные для редактирования (необязательны). Добавим notes как отдельное поле, если оно уже расшифровано
  initialEncryptedNotes?: string; // Альтернатива - передать зашифрованные заметки для редактирования
  onSubmit: (data: NewClient | (UpdateClient & { id: string })) => void; // Функция для отправки данных. Принимает NewClient или UpdateClient с id
  onCancel: () => void; // Функция для отмены
  userId: string; // ID текущего пользователя (обязательно для создания)
  isLoading?: boolean;
}

// Тип для состояния формы
// Для редактирования мы можем использовать тот же тип, но исключить `user_id` и `id` из обновляемых полей в handleSubmit
interface FormState {
  name: string;
  age: number | undefined;
  location: string;
  source: string;
  type: string;
  phone: string;
  email: string;
  telegram: string;
  session_price: number;
  payment_type: string;
  need_receipt: boolean;
  format: string;
  meeting_link: string;
  notes: string; // Нешифрованные заметки
  status: 'active' | 'paused' | 'completed'; // Статус - теперь с правильным типом
  // Поля, специфичные для создания
  idType: 'auto' | 'manual'; // Тип генерации ID
  manualId: string; // Поле для ручного ввода ID
}

const ClientForm: React.FC<ClientFormProps> = ({
  initialData,
  initialEncryptedNotes, // Новое свойство
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
    if (isEditing && (initialData || initialEncryptedNotes)) {
      // Для редактирования: используем данные из initialData или initialEncryptedNotes
      // idType будет 'manual', так как id уже задан
      // manualId будет равен initialData.id
      let decryptedNotes = '';
      if (initialData && initialData.notes !== undefined) {
        // Если notes переданы как расшифрованные
        decryptedNotes = initialData.notes;
      } else if (initialEncryptedNotes) {
        // Если передана зашифрованная строка, расшифровываем её
        decryptedNotes = decrypt(initialEncryptedNotes);
      }
      // Если ни то, ни другое не передано, оставляем пустую строку

      return {
        name: initialData?.name || '',
        age: initialData?.age || undefined,
        location: initialData?.location || '',
        source: initialData?.source || 'private',
        type: initialData?.type || 'regular',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        telegram: initialData?.telegram || '',
        session_price: initialData?.session_price || 0,
        payment_type: initialData?.payment_type || 'self-employed',
        need_receipt: initialData?.need_receipt !== undefined ? initialData.need_receipt : true,
        format: initialData?.format || 'online',
        meeting_link: initialData?.meeting_link || '',
        notes: decryptedNotes, // Используем расшифрованные заметки
        status: initialData?.status || 'active', // Статус при редактировании
        idType: 'manual', // ID уже задан, значит, ручной ввод (но поле ID не меняется)
        manualId: initialData?.id || '', // Используем существующий id
      };
    } else {
      // Для создания: начальные значения
      return {
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
        idType: 'auto', // По умолчанию автоматическая генерация
        manualId: '', // Пусто при автоматической генерации
      };
    }
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Локальное состояние для форматированного ввода стоимости сессии (с разделителем разрядов)
  const [sessionPriceInput, setSessionPriceInput] = useState<string>(() => {
    const price = isEditing ? (initialData?.session_price || 0) : 0;
    return price > 0 ? new Intl.NumberFormat('ru-RU').format(price) : '';
  });

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

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleIdTypeChange = (type: 'auto' | 'manual') => {
    if (isEditing) return; // Нельзя менять тип ID при редактировании
    setFormData(prev => ({
      ...prev,
      idType: type,
      // Если переключаемся на ручной ввод, оставляем текущее значение manualId, иначе очищаем
      // Если переключаемся на автоматический, очищаем manualId
      manualId: type === 'manual' ? prev.manualId : ''
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Имя обязательно и должно быть не короче 2 символов';
    }
    if (!isEditing && formData.idType === 'manual' && !formData.manualId) { // Проверка ID только при создании
      newErrors.manualId = 'ID клиента обязателен при ручном вводе';
    }
    if (formData.session_price <= 0) {
      newErrors.session_price = 'Стоимость должна быть больше 0';
    }
    // Проверка обязательных полей: source, type, payment_type
    if (!formData.source) {
      newErrors.source = 'Источник обязателен';
    }
    if (!formData.type) {
      newErrors.type = 'Тип клиента обязателен';
    }
    if (!formData.payment_type) {
      newErrors.payment_type = 'Форма оплаты обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing) {
      // Режим редактирования
      // Подготовка данных для отправки (UpdateClient)
      // Исключаем id и user_id из обновления
      const { idType, manualId, notes, ...updates } = formData; // idType и manualId не обновляются, notes не существует в таблице БД
      const updatePayload: UpdateClient & { id: string } = {
        ...updates,
        notes_encrypted: formData.notes ? encrypt(formData.notes) : null, // Шифруем заметки перед отправкой
        id: initialData?.id || '', // id обновляемого клиента
      };
      onSubmit(updatePayload);
    } else {
      // Режим создания
      // Подготовка данных для отправки (NewClient)
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
        status: formData.status, // Статус при создании по умолчанию 'active'
        // Остальные поля (total_sessions, total_paid, debt, created_at, updated_at) будут установлены БД/триггером
      };

      onSubmit(clientData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEditing && ( // Показываем поля ID только при создании
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">ID клиента</h3>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Тип ID
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
                <span className="ml-2 text-gray-900">Автоматический (auto_123)</span>
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
                <span className="ml-2 text-gray-900">Ручной ввод</span>
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
                  className={`mt-1 block w-full px-3 py-2 border ${errors.manualId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                  disabled={isEditing} // Нельзя менять ID при редактировании
                />
                {errors.manualId && <p className="mt-1 text-sm text-red-600">{errors.manualId}</p>}
              </div>
            )}
          </div>
        </div>
      )}

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
              className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
              className={`mt-1 block w-full px-3 py-2 border ${errors.source ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
              disabled={isEditing} // Предположим, source нельзя менять при редактировании
            >
              <option value="">Выберите источник</option>
              <option value="private">Личный</option>
              <option value="yasno">Ясно</option>
              <option value="zigmund">Зигмунд</option>
              <option value="alter">Alter</option>
              <option value="other">Другое</option>
            </select>
            {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source}</p>}
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
              className={`mt-1 block w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            >
              <option value="">Выберите тип</option>
              <option value="regular">Системный (регулярные сессии)</option>
              <option value="one-time">Разовый</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wallet className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="session_price"
                name="session_price"
                value={sessionPriceInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Форматируем ввод сразу с разделителями
                  const digits = raw.replace(/[^\d]/g, '');
                  const num = parseInt(digits, 10) || 0;
                  const formatted = num > 0 ? new Intl.NumberFormat('ru-RU').format(num) : '';
                  setSessionPriceInput(formatted);
                  setFormData(prev => ({ ...prev, session_price: num }));
                  if (errors.session_price) {
                    setErrors(prev => ({ ...prev, session_price: undefined }));
                  }
                }}
                className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-8 py-2 border ${errors.session_price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₽</span>
              </div>
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
              className={`mt-1 block w-full px-3 py-2 border ${errors.payment_type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            >
              <option value="">Выберите форму оплаты</option>
              <option value="self-employed">Самозанятый (чеки нужны)</option>
              <option value="ip">ИП (чеки нужны)</option>
              <option value="cash">Наличные (без чеков)</option>
              <option value="platform">Через платформу</option>
            </select>
            {errors.payment_type && <p className="mt-1 text-sm text-red-600">{errors.payment_type}</p>}
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
              <span className="ml-2 text-gray-900">Онлайн</span>
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
              <span className="ml-2 text-gray-900">Офлайн</span>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
          {isEditing ? 'Сохранить изменения' : 'Создать клиента'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;

// Тип для ошибок валидации
interface FormErrors {
  name?: string;
  manualId?: string;
  session_price?: string;
  source?: string;
  type?: string;
  payment_type?: string;
}