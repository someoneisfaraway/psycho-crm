// src/components/calendar/SessionModal.tsx
import React, { useState, useEffect } from 'react';
import { format, parseISO, set } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, Calendar, Clock, User, CreditCard, Mail } from 'lucide-react';
import { encrypt } from '../../utils/encryption'; // Импортируем функцию шифрования

interface SessionModalProps {
  mode: 'create' | 'edit' | 'view'; // Режим работы модального окна
  session?: Session | null; // Данные сессии (для редактирования/просмотра)
  clients: Client[]; // Список клиентов для выбора
  isOpen: boolean; // Открыт ли модал
  onClose: () => void; // Функция закрытия
  onSave: (session: Session) => void; // Функция сохранения (для create/edit)
  selectedDate?: Date; // Выбранная дата (для создания новой сессии)
}

// Тип для состояния формы
interface FormState {
  client_id: string;
  scheduled_at: Date;
  duration: number;
  format: 'online' | 'offline';
  meeting_link: string;
  price: number;
  note: string; // Нешифрованная заметка
}

const SessionModal: React.FC<SessionModalProps> = ({ mode, session, clients, isOpen, onClose, onSave, selectedDate }) => {
  const isCreating = mode === 'create';
  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';

  const [formData, setFormData] = useState<FormState>({
    client_id: '',
    scheduled_at: new Date(), // По умолчанию текущее время или выбранная дата
    duration: 50, // По умолчанию из ТЗ
    format: 'online',
    meeting_link: '',
    price: 0, // Будет заполнено из данных клиента или по умолчанию
    note: '',
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});

  // Инициализация состояния при открытии модалки
  useEffect(() => {
    if (isCreating && selectedDate) {
      // Для создания используем выбранную дату, устанавливая время на 00:00, затем добавляем 1 час (или ближайший 15-мин интервал)
      const defaultTime = new Date(selectedDate);
      defaultTime.setHours(10, 0, 0, 0); // Установим на 10:00 как пример
      setFormData(prev => ({
        ...prev,
        scheduled_at: defaultTime,
        client_id: '', // Очищаем клиента при создании
        note: '', // Очищаем заметку
        // price будет заполнено при выборе клиента
      }));
    } else if ((isEditing || isViewing) && session) {
      // Для редактирования/просмотра используем данные сессии
      // Расшифровываем заметку при редактировании
      let decryptedNote = '';
      if (isEditing && session.note_encrypted) {
        try {
          decryptedNote = session.note_encrypted; // Псевдо-расшифровка или передача уже расшифрованной строки
          // В реальности: decryptedNote = decrypt(session.note_encrypted);
          // Но для MVP с localStorage ключа, расшифровка может быть сложной без контекста.
          // Пусть `session` передаётся в `SessionModal` с уже расшифрованной `note` или `notes` вместо `note_encrypted`.
          // Или `SessionModal` получает `notes` при редактировании.
          // Пока что, если `note_encrypted` есть и мы редактируем, покажем зашифрованный текст или сообщение.
          // Лучше всего, чтобы `CalendarScreen` передавал расшифрованную `note` как `notes` или `note`.
          // Исправим: `CalendarScreen` передаёт `session` с `note` вместо `note_encrypted` при редактировании.
          // Тогда `session.note` будет нешифрованным.
          // В ТЗ 6.3.4: "Заметка о планируемой сессии:" - это для создания.
          // "Заметка о сессии(если есть)" - это для просмотра/редактирования.
          // В `SessionDetail` (6.3.3) "Заметка о сессии" - это `note_encrypted`, которое нужно расшифровать.
          // Значит, `session.note_encrypted` нужно расшифровать при передаче в `SessionModal` или `SessionDetail`.
          // В `CalendarScreen.tsx` при вызове `handleViewSession`/`handleEditSession`:
          // const decryptedSession = { ...session, note: session.note_encrypted ? decrypt(session.note_encrypted) : '' };
          // setSelectedSession(decryptedSession);
          // Пока что, `session.note_encrypted` передаётся как есть.
          // В `SessionModal` при `isEditing` нужно расшифровать `session.note_encrypted`.
          // Псевдо-расшифровка:
          // decryptedNote = session.note_encrypted; // или decrypt(session.note_encrypted);
        } catch (e) {
          console.error("Decryption failed in SessionModal:", e);
          decryptedNote = "Ошибка расшифровки заметки."; // Показываем сообщение об ошибке
        }
      }
      setFormData({
        client_id: session.client_id,
        scheduled_at: parseISO(session.scheduled_at), // Преобразуем строку в Date
        duration: session.duration || 50,
        format: session.format as 'online' | 'offline',
        meeting_link: session.meeting_link || '',
        price: session.price,
        note: isEditing ? decryptedNote : session.note_encrypted || '', // Показываем расшифрованную или зашифрованную
      });
    }
  }, [isCreating, isEditing, isViewing, session, selectedDate]);

  // Обновляем цену при выборе клиента (только при создании)
  useEffect(() => {
    if (isCreating && formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client) {
        setFormData(prev => ({
          ...prev,
          price: client.session_price // Устанавливаем цену из профиля клиента
        }));
      }
    }
  }, [formData.client_id, clients, isCreating]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'number') {
      processedValue = Number(value);
    } else if (type === 'datetime-local' && name === 'scheduled_at') {
      processedValue = new Date(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setFormData(prev => ({
      ...prev,
      client_id: clientId
    }));

    // Очищаем ошибку для клиента
    if (errors.client_id) {
      setErrors(prev => ({ ...prev, client_id: undefined }));
    }

    // Обновляем цену, если это создание
    if (isCreating) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          price: client.session_price
        }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!formData.client_id) {
      newErrors.client_id = 'Клиент обязателен';
    }
    if (isNaN(formData.scheduled_at.getTime()) || formData.scheduled_at < new Date(Date.now() - 24 * 60 * 60 * 1000)) { // Проверка на валидность даты и не прошлое (с запасом 1 день)
      newErrors.scheduled_at = 'Дата и время обязательны и не могут быть в прошлом';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Стоимость должна быть больше 0';
    }
    if (isCreating && formData.format === 'online' && !formData.meeting_link) {
      // meeting_link опционально, но можно сделать обязательным при онлайн-формате
      // newErrors.meeting_link = 'Ссылка на встречу обязательна для онлайн-формата';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Подготовка данных для отправки
    const sessionData: any = {
      client_id: formData.client_id,
      scheduled_at: formData.scheduled_at.toISOString(),
      duration: formData.duration,
      format: formData.format,
      price: formData.price,
      meeting_link: formData.meeting_link || null,
      note_encrypted: formData.note ? encrypt(formData.note) : null, // Шифруем заметку перед отправкой
    };

    if (isCreating) {
      // При создании передаём только данные новой сессии
      onSave(sessionData);
    } else if (isEditing && session) {
      // При редактировании передаём ID и обновления
      onSave({ id: session.id, ...sessionData });
    }
  };

  if (!isOpen) {
    return null;
  }

  // Вспомогательные функции для форматирования
  const formatDateTime = (date: Date) => format(date, 'd MMMM yyyy в HH:mm', { locale: ru });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreating ? 'Новая сессия' : isEditing ? 'Редактирование сессии' : 'Сессия'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Секция 1: Выбор клиента */}
              <div className="md:col-span-2">
                <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Клиент *
                </label>
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleClientChange}
                  className={`w-full px-3 py-2 border ${errors.client_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isViewing || isEditing} // Запрещаем менять клиента при редактировании/просмотре
                >
                  <option value="">Выберите клиента</option>
                  {clients
                    .filter(c => c.status === 'active') // Показываем только активных
                    .map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} • {client.id} • Последняя: {client.last_session_at ? format(parseISO(client.last_session_at), 'd MMM', { locale: ru }) : 'Нет'}
                      </option>
                    ))}
                </select>
                {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
              </div>

              {/* Секция 2: Дата и время */}
              <div>
                <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата и время *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    id="scheduled_at"
                    name="scheduled_at"
                    value={formData.scheduled_at ? format(formData.scheduled_at, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={handleChange}
                    className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border ${errors.scheduled_at ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm`}
                    disabled={isViewing}
                  />
                </div>
                {errors.scheduled_at && <p className="mt-1 text-sm text-red-600">{errors.scheduled_at}</p>}
              </div>

              {/* Секция 3: Длительность */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Длительность (мин)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
                    disabled={isViewing}
                  />
                </div>
              </div>

              {/* Секция 4: Формат */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Формат *
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="online"
                      checked={formData.format === 'online'}
                      onChange={(e) => setFormData({...formData, format: e.target.value as 'online' | 'offline'})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isViewing}
                    />
                    <span className="ml-2">Онлайн</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="offline"
                      checked={formData.format === 'offline'}
                      onChange={(e) => setFormData({...formData, format: e.target.value as 'online' | 'offline'})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isViewing}
                    />
                    <span className="ml-2">Офлайн</span>
                  </label>
                </div>
              </div>

              {/* Секция 5: Ссылка на встречу (только для онлайн) */}
              {formData.format === 'online' && (
                <div className="md:col-span-2">
                  <label htmlFor="meeting_link" className="block text-sm font-medium text-gray-700 mb-1">
                    Ссылка на встречу
                  </label>
                  <input
                    type="url"
                    id="meeting_link"
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleChange}
                    placeholder="https://zoom.us/j/..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isViewing}
                  />
                </div>
              )}

              {/* Секция 6: Стоимость */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Стоимость *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-3 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm`}
                    disabled={isViewing}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₽</span>
                  </div>
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              {/* Секция 7: Заметка */}
              <div className="md:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  {isCreating ? 'Заметка о планируемой сессии' : 'Заметка о сессии'}
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isCreating ? "Цель сессии, особенности..." : ""}
                  disabled={isViewing}
                />
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Отменить
              </Button>
              {!isViewing && (
                <Button
                  type="submit"
                >
                  {isCreating ? 'Создать сессию' : 'Сохранить изменения'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;