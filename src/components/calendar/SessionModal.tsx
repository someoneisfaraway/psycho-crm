import React, { useState, useEffect } from 'react';
import type { Session, Client } from '../../types/database';
import { Button } from '../ui/Button';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Partial<Session>) => void;
  session?: Session;
 clients: Client[];
}

const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, onSave, session, clients }) => {
  const [formData, setFormData] = useState<Partial<Session>>({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    session_number: 1,
    status: 'scheduled',
    payment_status: 'pending',
    payment_amount: 0,
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session) {
      setFormData({
        ...session,
        date: session.date ? new Date(session.date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        session_number: 1,
        status: 'scheduled',
        payment_status: 'pending',
        payment_amount: 0,
        notes: ''
      });
    }
  }, [session]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_id) newErrors.client_id = 'Выберите клиента';
    if (!formData.date) newErrors.date = 'Укажите дату';
    if (!formData.start_time) newErrors.start_time = 'Укажите время начала';
    if (!formData.end_time) newErrors.end_time = 'Укажите время окончания';
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.time = 'Время окончания должно быть позже времени начала';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {session ? 'Редактировать сессию' : 'Новая сессия'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Клиент
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className={`w-full p-2 border rounded ${errors.client_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Выберите клиента</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
                {errors.client_id && <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full p-2 border rounded ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className={`w-full p-2 border rounded ${errors.start_time ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className={`w-full p-2 border rounded ${errors.end_time ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
                  {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="scheduled">Запланирована</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>

              {formData.status === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Статус оплаты
                  </label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="pending">Ожидает оплаты</option>
                    <option value="paid">Оплачено</option>
                    <option value="unpaid">Не оплачено</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма оплаты
                </label>
                <input
                  type="number"
                  value={formData.payment_amount || ''}
                  onChange={(e) => setFormData({ ...formData, payment_amount: Number(e.target.value) })}
                  className="w-full p-2 border-gray-300 rounded"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Примечания
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Дополнительная информация о сессии"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit">
                {session ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;