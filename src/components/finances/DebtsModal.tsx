// src/components/finances/DebtsModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { X } from 'lucide-react';

interface DebtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Debt {
  session_date: string;
  client_name: string;
  amount: number;
}

const DebtsModal: React.FC<DebtsModalProps> = ({ isOpen, onClose, userId }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchDebts();
  }, [isOpen]);

  const fetchDebts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          scheduled_at,
          price,
          clients ( name )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('paid', false)
        .order('scheduled_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      const debtList = (sessions || []).map((s: any) => ({
        session_date: new Date(s.scheduled_at).toLocaleString('ru-RU'),
        client_name: s.clients?.name || 'Неизвестный клиент',
        amount: s.price || 0,
      }));

      setDebts(debtList);
    } catch (err: any) {
      console.error('Ошибка загрузки задолженностей:', err);
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Задолженности</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-6">Загрузка...</div>
          ) : error ? (
            <div className="text-red-600 py-2">{error}</div>
          ) : debts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата и время</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {debts.map((debt, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{debt.session_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{debt.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{debt.amount.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500">Задолженностей нет</p>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtsModal;
