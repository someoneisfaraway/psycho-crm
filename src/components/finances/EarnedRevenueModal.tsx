// src/components/finances/EarnedRevenueModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { X } from 'lucide-react';

interface EarnedRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialStartDate: string;
  initialEndDate: string;
}

interface RevenueBySource {
  source: string;
  total: number;
}

const EarnedRevenueModal: React.FC<EarnedRevenueModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialStartDate,
  initialEndDate,
}) => {
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueBySource, setRevenueBySource] = useState<RevenueBySource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchRevenue();
  }, [isOpen, startDate, endDate]);

  const fetchRevenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          price,
          paid,
          client_id,
          clients ( source )
        `)
        .eq('user_id', userId)
        .eq('paid', true)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString());

      if (sessionsError) throw sessionsError;

      const totals: Record<string, number> = {};
      let total = 0;

      (sessions || []).forEach((s: any) => {
        const price = s.price || 0;
        const source = s.clients?.source || 'unknown';
        totals[source] = (totals[source] || 0) + price;
        total += price;
      });

      const breakdown = Object.entries(totals).map(([source, amount]) => ({
        source: source === 'private' ? 'Личные' : source,
        total: amount,
      }));

      setTotalRevenue(total);
      setRevenueBySource(breakdown);
    } catch (err: any) {
      console.error('Ошибка загрузки дохода:', err);
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-40">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Доход за период</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Начало периода</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Конец периода</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-6">Загрузка...</div>
          ) : error ? (
            <div className="text-red-600 py-2">{error}</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Итого заработано</div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalRevenue.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              {revenueBySource.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">По источникам клиентов</div>
                  {revenueBySource.map((item) => (
                    <div key={item.source} className="flex justify-between items-center">
                      <span className="text-gray-800">{item.source}</span>
                      <span className="font-semibold text-gray-900">
                        {item.total.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  ))}
                </div>
              )}
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

export default EarnedRevenueModal;
