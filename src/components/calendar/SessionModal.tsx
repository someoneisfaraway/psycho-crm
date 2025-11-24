// src/components/calendar/SessionModal.tsx
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';
import { X, Calendar, Clock, Wallet } from 'lucide-react';
import { encrypt } from '../../utils/encryption'; // РРјРїРѕСЂС‚РёСЂСѓРµРј С„СѓРЅРєС†РёСЋ С€РёС„СЂРѕРІР°РЅРёСЏ
import { decrypt } from '../../utils/encryption';
import { isUnlocked } from '../../utils/encryption';
import { ENCRYPTION_EVENT } from '../../utils/encryption';
import { useAuth } from '../../contexts/AuthContext';

interface SessionModalProps {
  mode?: 'create' | 'edit' | 'view'; // Р РµР¶РёРј СЂР°Р±РѕС‚С‹ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
  session?: Session | null; // Р”Р°РЅРЅС‹Рµ СЃРµСЃСЃРёРё (РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ/РїСЂРѕСЃРјРѕС‚СЂР°)
  clients: Client[]; // РЎРїРёСЃРѕРє РєР»РёРµРЅС‚РѕРІ РґР»СЏ РІС‹Р±РѕСЂР°
  isOpen: boolean; // РћС‚РєСЂС‹С‚ Р»Рё РјРѕРґР°Р»
  onClose: () => void; // Р¤СѓРЅРєС†РёСЏ Р·Р°РєСЂС‹С‚РёСЏ
  onSave: (session: any) => void; // Р¤СѓРЅРєС†РёСЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ (РґР»СЏ create/edit)
  selectedDate?: Date; // Р’С‹Р±СЂР°РЅРЅР°СЏ РґР°С‚Р° (РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РЅРѕРІРѕР№ СЃРµСЃСЃРёРё)
  initialClientId?: string; // РџСЂРµРґСѓСЃС‚Р°РЅРѕРІР»РµРЅРЅС‹Р№ РєР»РёРµРЅС‚ РїСЂРё РѕС‚РєСЂС‹С‚РёРё РјРѕРґР°Р»Р°
  userId?: string; // ID С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РЅРѕРІРѕР№ СЃРµСЃСЃРёРё)
}

// РўРёРї РґР»СЏ СЃРѕСЃС‚РѕСЏРЅРёСЏ С„РѕСЂРјС‹
interface FormState {
  client_id: string;
  scheduled_at: Date;
  duration: number;
  format: 'online' | 'offline';
  meeting_link: string;
  price: number;
  note: string; // РќРµС€РёС„СЂРѕРІР°РЅРЅР°СЏ Р·Р°РјРµС‚РєР°
}

// РўРёРї РѕС€РёР±РѕРє С„РѕСЂРјС‹
type FormErrors = Partial<Record<keyof FormState, string>>;

const SessionModal: React.FC<SessionModalProps> = ({ mode, session, clients, isOpen, onClose, onSave, selectedDate, initialClientId, userId }) => {
  const effectiveMode: 'create' | 'edit' | 'view' = mode ?? (session ? 'edit' : 'create');
  const isCreating = effectiveMode === 'create';
  const isEditing = effectiveMode === 'edit';
  const isViewing = effectiveMode === 'view';
  const { user } = useAuth();



  const [formData, setFormData] = useState<FormState>({
    client_id: '',
    scheduled_at: new Date(), // РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ С‚РµРєСѓС‰РµРµ РІСЂРµРјСЏ РёР»Рё РІС‹Р±СЂР°РЅРЅР°СЏ РґР°С‚Р°
    duration: 50, // РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ РёР· РўР—
    format: 'online',
    meeting_link: '',
    price: 0, // Р‘СѓРґРµС‚ Р·Р°РїРѕР»РЅРµРЅРѕ РёР· РґР°РЅРЅС‹С… РєР»РёРµРЅС‚Р° РёР»Рё РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
    note: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [priceInput, setPriceInput] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [durationInput, setDurationInput] = useState<string>('');

  // РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ СЃРѕСЃС‚РѕСЏРЅРёСЏ РїСЂРё РѕС‚РєСЂС‹С‚РёРё РјРѕРґР°Р»РєРё
  useEffect(() => {
    if (isCreating && selectedDate) {
      // Р”Р»СЏ СЃРѕР·РґР°РЅРёСЏ РёСЃРїРѕР»СЊР·СѓРµРј РІС‹Р±СЂР°РЅРЅСѓСЋ РґР°С‚Сѓ
      const defaultTime = new Date(selectedDate);
      defaultTime.setHours(10, 0, 0, 0); // РЈСЃС‚Р°РЅРѕРІРёРј РЅР° 10:00 РєР°Рє РїСЂРёРјРµСЂ
      setFormData(prev => ({
        ...prev,
        scheduled_at: defaultTime,
        client_id: initialClientId || '', // РџСЂРµРґР·Р°РїРѕР»РЅСЏРµРј РєР»РёРµРЅС‚Р°, РµСЃР»Рё РѕРЅ РїРµСЂРµРґР°РЅ
        note: '', // РћС‡РёС‰Р°РµРј Р·Р°РјРµС‚РєСѓ
        // price Р±СѓРґРµС‚ Р·Р°РїРѕР»РЅРµРЅРѕ РїСЂРё РІС‹Р±РѕСЂРµ РєР»РёРµРЅС‚Р°
      }));
      setDurationInput('50');
    } else if ((isEditing || isViewing) && session) {
      // Для редактирования/просмотра используем данные сессии
      let decryptedNote = '';
      if (session.note_encrypted) {
        try {
          decryptedNote = isUnlocked(user?.id ?? '') ? (decrypt(session.note_encrypted ?? '') || '') : '';
        } catch (e) {
          console.error('Decryption failed in SessionModal:', e);
          decryptedNote = '';
        }
      }
      setFormData({
        client_id: session.client_id,
        scheduled_at: parseISO(session.scheduled_at),
        duration: session.duration || 50,
        format: session.format as 'online' | 'offline',
        meeting_link: session.meeting_link || '',
        price: session.price,
        note: decryptedNote,
      });
      setPriceInput(session.price > 0 ? new Intl.NumberFormat('ru-RU').format(session.price) : '');
      setDurationInput(String(session.duration || 50));
    }
  }, [isCreating, isEditing, isViewing, session, selectedDate, initialClientId, user?.id]);

  // Подписка на глобальное событие шифрования для обновления заметки при разблокировке/блокировке
  useEffect(() => {
    if (!(isEditing || isViewing) || !session?.note_encrypted) return;
    const handler = () => {
      try {
        const nextNote = isUnlocked(user?.id ?? '') ? (decrypt(session.note_encrypted ?? '') || '') : '';
        setFormData(prev => ({ ...prev, note: nextNote }));
      } catch (e) {
        console.error('Decryption event handling failed in SessionModal:', e);
      }
    };
    window.addEventListener(ENCRYPTION_EVENT, handler as EventListener);
    return () => window.removeEventListener(ENCRYPTION_EVENT, handler as EventListener);
  }, [isEditing, isViewing, session?.note_encrypted, user?.id]);

  // РћР±РЅРѕРІР»СЏРµРј С†РµРЅСѓ РїСЂРё РІС‹Р±РѕСЂРµ РєР»РёРµРЅС‚Р° (С‚РѕР»СЊРєРѕ РїСЂРё СЃРѕР·РґР°РЅРёРё)
  useEffect(() => {
    if (isCreating && formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client) {
        setFormData(prev => ({
          ...prev,
          price: client.session_price // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј С†РµРЅСѓ РёР· РїСЂРѕС„РёР»СЏ РєР»РёРµРЅС‚Р°
        }));
        setPriceInput(client.session_price > 0 ? new Intl.NumberFormat('ru-RU').format(client.session_price) : '');
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

    setFormData((prev: FormState) => ({
      ...prev,
      [name]: processedValue as any
    }));

    if (errors[name as keyof FormState]) {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
    }
    
    // РћС‡РёС‰Р°РµРј РѕС€РёР±РєСѓ РѕС‚РїСЂР°РІРєРё РїСЂРё РёР·РјРµРЅРµРЅРёРё РґР°РЅРЅС‹С…
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setFormData((prev: FormState) => ({
      ...prev,
      client_id: clientId
    }));

    if (errors.client_id) {
      setErrors((prev: FormErrors) => ({ ...prev, client_id: undefined }));
    }

    // РћС‡РёС‰Р°РµРј РѕС€РёР±РєСѓ РѕС‚РїСЂР°РІРєРё РїСЂРё РёР·РјРµРЅРµРЅРёРё РєР»РёРµРЅС‚Р°
    if (submitError) {
      setSubmitError('');
    }

    if (isCreating) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData((prev: FormState) => ({
          ...prev,
          price: client.session_price
        }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.client_id) {
      newErrors.client_id = 'Клиент обязателен';
    }
    
    // РџСЂРѕРІРµСЂРєР° РґР°С‚С‹ Рё РІСЂРµРјРµРЅРё СЃ СѓС‡РµС‚РѕРј С‡Р°СЃРѕРІРѕРіРѕ РїРѕСЏСЃР°
    const scheduledDate = formData.scheduled_at;
    if (!scheduledDate || isNaN(scheduledDate.getTime())) {
      newErrors.scheduled_at = 'Дата и время обязательны';
    } else {
      // РСЃРїРѕР»СЊР·СѓРµРј Р»РѕРєР°Р»СЊРЅРѕРµ РІСЂРµРјСЏ РґР»СЏ РїСЂРѕРІРµСЂРєРё (РЅРµ РІ РїСЂРѕС€Р»РѕРј)
      const now = new Date();
      if (false && scheduledDate < now) {
        newErrors.scheduled_at = 'Дата и время не могут быть в прошлом';
      }
    }
    
    if (formData.price <= 0) {
      newErrors.price = 'Стоимость должна быть больше 0';
    }
    if (isCreating && formData.format === 'online' && !formData.meeting_link) {
      // meeting_link РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РЅРѕ РјРѕР¶РЅРѕ СЃРґРµР»Р°С‚СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј РїСЂРё РѕРЅР»Р°Р№РЅ-С„РѕСЂРјР°С‚Рµ
      // newErrors.meeting_link = 'РЎСЃС‹Р»РєР° РЅР° РІСЃС‚СЂРµС‡Сѓ РѕР±СЏР·Р°С‚РµР»СЊРЅР° РґР»СЏ РѕРЅР»Р°Р№РЅ-С„РѕСЂРјР°С‚Р°';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form validation starting...');
    if (!validate()) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    // РџРѕРґРіРѕС‚РѕРІРєР° РґР°РЅРЅС‹С… РґР»СЏ РѕС‚РїСЂР°РІРєРё
    console.log('Preparing session data...');
    console.log('UserId from props:', userId);
    console.log('Form data:', formData);
    console.log('Client ID from form:', formData.client_id);
    console.log('Client ID type:', typeof formData.client_id);
    
    if (!userId) {
      console.error('UserId is missing! Cannot create session.');
      setSubmitError('Ошибка: Пользователь не авторизован. Пожалуйста, войдите снова.');
      setIsSubmitting(false);
      return;
    }
    
    let noteEncrypted: string | null = null;
    if (formData.note) {
      try {
        noteEncrypted = encrypt(formData.note);
      } catch (e) {
        setSubmitError('Не удалось зашифровать заметку. Войдите заново и попробуйте снова.');
        setIsSubmitting(false);
        return;
      }
    }

    const sessionData: any = {
      user_id: userId, // РСЃРїРѕР»СЊР·СѓРµРј userId РёР· РїСЂРѕРїСЃРѕРІ РґР»СЏ РЅРѕРІРѕР№ СЃРµСЃСЃРёРё
      client_id: formData.client_id,
      scheduled_at: formData.scheduled_at.toISOString(),
      duration: formData.duration,
      format: formData.format,
      price: formData.price,
      meeting_link: formData.meeting_link || null,
      note_encrypted: noteEncrypted, // РЁРёС„СЂСѓРµРј Р·Р°РјРµС‚РєСѓ РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№
      status: 'scheduled',
    };
    
    console.log('Session data prepared:', sessionData);

    try {
      if (isCreating) {
        console.log('Creating new session...');
        await onSave(sessionData);
      } else if (isEditing && session) {
        console.log('Updating existing session...');
        const { status, ...rest } = sessionData;
        await onSave({ id: session.id, ...rest });
      }
      console.log('Session saved successfully, closing modal...');
      onClose();
    } catch (err: any) {
      // РћС€РёР±РєСѓ РѕР±СЂР°Р±РѕС‚РєРё РѕСЃС‚Р°РІРёРј СЂРѕРґРёС‚РµР»СЋ (CalendarScreen), Р·РґРµСЃСЊ РЅРµ Р·Р°РєСЂС‹РІР°РµРј РјРѕРґР°Р»РєСѓ РїСЂРё РѕС€РёР±РєРµ
      console.error('Error during session save:', err);
      
      // РЈР»СѓС‡С€РµРЅРЅР°СЏ РѕР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
      let errorMessage = 'Ошибка при сохранении сессии. Попробуйте еще раз.';
      
      errorMessage = 'Ошибка при сохранении сессии. Попробуйте еще раз.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 409) {
        errorMessage = 'На выбранное время уже запланирована другая сессия. Выберите другое время.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Некорректные данные. Проверьте заполнение всех полей.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Р’СЃРїРѕРјРѕРіР°С‚РµР»СЊРЅС‹Рµ С„СѓРЅРєС†РёРё РґР»СЏ С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёСЏ
// const formatDateTime = (date: Date) => format(date, 'd MMMM yyyy РІ HH:mm', { locale: ru });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="modal-container w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="modal-title">
              {isCreating ? 'Новая сессия' : isEditing ? 'Редактирование сессии' : 'Сессия'}
            </h2>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* РЎРµРєС†РёСЏ 1: Р’С‹Р±РѕСЂ РєР»РёРµРЅС‚Р° */}
              <div className="md:col-span-2">
                <label htmlFor="client_id" className="form-label">
                  Клиент *
                </label>
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleClientChange}
                  className={`form-input ${errors.client_id ? 'border-status-error' : ''}`}
                  disabled={isViewing || isEditing} // Р—Р°РїСЂРµС‰Р°РµРј РјРµРЅСЏС‚СЊ РєР»РёРµРЅС‚Р° РїСЂРё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРё/РїСЂРѕСЃРјРѕС‚СЂРµ
                >
                  <option value="">Выберите клиента</option>
                  {clients
                    .filter(c => c.status === 'active')
                    .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }))
                    .map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                </select>
                {errors.client_id && <p className="form-error">{errors.client_id}</p>}
              </div>

              {/* РЎРµРєС†РёСЏ 2: Р”Р°С‚Р° Рё РІСЂРµРјСЏ */}
              <div>
                <label htmlFor="scheduled_at" className="form-label">
                  Дата и время *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                    <Calendar className="h-5 w-5 text-icon-secondary" />
                  </div>
                  <input
                    type="datetime-local"
                    id="scheduled_at"
                    name="scheduled_at"
                    value={formData.scheduled_at ? format(formData.scheduled_at, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={handleChange}
                    className={`form-input pl-10 ${errors.scheduled_at ? 'border-status-error' : ''}`}
                    disabled={isViewing}
                  />
                </div>
                {errors.scheduled_at && <p className="form-error">{errors.scheduled_at}</p>}
              </div>

              {/* Секция 3: Длительность */}
              <div>
                <label htmlFor="duration" className="form-label">
                  Длительность (мин)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-icon-secondary" />
                  </div>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={durationInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDurationInput(raw);
                      const num = parseInt(raw.replace(/[^\d]/g, ''), 10);
                      setFormData(prev => ({ ...prev, duration: Number.isFinite(num) ? num : 0 }));
                      if (errors.duration) {
                        setErrors(prev => ({ ...prev, duration: undefined }));
                      }
                      if (submitError) {
                        setSubmitError('');
                      }
                    }}
                    className="form-input pl-10"
                    disabled={isViewing}
                  />
                </div>
              </div>

              {/* Секция 4: Формат */}
              <div className="md:col-span-2">
                <label className="form-label">
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
                      className="form-radio"
                      disabled={isViewing}
                    />
              <span className="ml-2 text-text-primary">Онлайн</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="offline"
                      checked={formData.format === 'offline'}
                      onChange={(e) => setFormData({...formData, format: e.target.value as 'online' | 'offline'})}
                      className="form-radio"
                      disabled={isViewing}
                    />
              <span className="ml-2 text-text-primary">Офлайн</span>
                  </label>
                </div>
              </div>

              {/* РЎРµРєС†РёСЏ 5: РЎСЃС‹Р»РєР° РЅР° РІСЃС‚СЂРµС‡Сѓ (С‚РѕР»СЊРєРѕ РґР»СЏ РѕРЅР»Р°Р№РЅ) */}
              {formData.format === 'online' && (
                <div className="md:col-span-2">
                  <label htmlFor="meeting_link" className="form-label">
                    Ссылка на встречу
                  </label>
                  <input
                    type="url"
                    id="meeting_link"
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleChange}
                    placeholder="https://zoom.us/j/..."
                    className="form-input"
                    disabled={isViewing}
                  />
                </div>
              )}

              {/* РЎРµРєС†РёСЏ 6: РЎС‚РѕРёРјРѕСЃС‚СЊ */}
              <div>
                <label htmlFor="price" className="form-label">
                  Стоимость *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet className="h-5 w-5 text-icon-secondary" />
                  </div>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={priceInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setPriceInput(raw);
                      const num = parseInt(raw.replace(/[^\d]/g, ''), 10) || 0;
                      setFormData(prev => ({ ...prev, price: num }));
                      if (errors.price) {
                        setErrors(prev => ({ ...prev, price: undefined }));
                      }
                    }}
                    onBlur={() => {
                      setPriceInput(formData.price > 0 ? new Intl.NumberFormat('ru-RU').format(formData.price) : '');
                    }}
                    className={`form-input pl-10 pr-8 ${errors.price ? 'border-status-error' : ''}`}
                    disabled={isViewing}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-text-secondary text-sm">₽</span>
                  </div>
                </div>
                {errors.price && <p className="form-error">{errors.price}</p>}
              </div>

              {/* РЎРµРєС†РёСЏ 7: Р—Р°РјРµС‚РєР° */}
              <div className="md:col-span-2">
                <label htmlFor="note" className="form-label">
                  {isCreating ? 'Заметка о планируемой сессии' : 'Заметка о сессии'}
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Эта информация шифруется, доступ только для вас."
                  disabled={isViewing}
                />
              </div>
            </div>

            {/* РЎРѕРѕР±С‰РµРЅРёРµ РѕР± РѕС€РёР±РєРµ */}
            {submitError && (
              <div className="mt-4 p-3 bg-status-error-bg border border-status-error-border rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-status-error" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-status-error-text">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* РљРЅРѕРїРєРё РґРµР№СЃС‚РІРёР№ */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Отменить
              </Button>
              {!isViewing && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    isCreating ? 'Создать сессию' : 'Сохранить изменения'
                  )}
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
