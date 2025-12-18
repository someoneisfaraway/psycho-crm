// src/components/finances/ReceiptsModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { X } from 'lucide-react';

interface ReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Receipt {
  session_date: string;
  client_name: string;
  amount: number;
}

const ReceiptsModal: React.FC<ReceiptsModalProps> = ({ isOpen, onClose, userId }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchReceipts();
  }, [isOpen]);

  const fetchReceipts = async () => {
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
        .eq('paid', true)
        .eq('receipt_sent', false)
        .order('scheduled_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const receiptsList = (sessions || []).map((s: any) => ({
        session_date: new Date(s.scheduled_at).toLocaleString('ru-RU'),
        client_name: s.clients?.name || 'Неизвестный клиент',
        amount: s.price || 0,
      }));

      setReceipts(receiptsList);
    } catch (err: any) {
      console.error('Ошибка загрузки чеков:', err);
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-40">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="modal-title">Чеки</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-6 text-text-secondary">Загрузка...</div>
          ) : error ? (
            <div className="text-status-error-text py-2">{error}</div>
          ) : receipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Дата и время</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Сумма</th>
                  </tr>
                </thead>
                <tbody className="bg-bg-primary divide-y divide-border-primary">
                  {receipts.map((receipt, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{receipt.session_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{receipt.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{receipt.amount.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-text-secondary">Нет чеков для отправки</p>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-border-primary">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsModal;
