// src/pages/FinancialSummaryScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialSummary } from '../api/finances';
import type { FinancialSummary } from '../api/finances';
import { DollarSign, TrendingUp, AlertCircle, FileText } from 'lucide-react';

const FinancialSummaryScreen: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Период по умолчанию: текущий месяц
  const [startDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });

  const { user: authUser, loading: authLoading } = useAuth();

  // handleStartDateChange and handleEndDateChange are declared but not used
  // const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value);
  // const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!authUser?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getFinancialSummary(startDate, endDate, authUser.id);
        setSummary(data);
      } catch (err) {
        console.error('Error fetching financial summary:', err);
        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchSummary();
  }, [authUser?.id, authLoading, startDate, endDate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
          </div>
          <div className="text-center py-8">Загрузка финансовой информации...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            <strong className="font-bold">Ошибка: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
          </div>
          <div className="text-center py-8">Нет данных для отображения.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
        </div>

      {/* Карточки сводки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Заработано */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-semibold text-gray-900">Заработано</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{(summary.totalRevenue || 0).toLocaleString('ru-RU')} ₽</p>
              <p className="mt-2 text-sm text-gray-500">За текущий месяц</p>
            </div>
            <DollarSign className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Ожидается */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-semibold text-gray-900">Ожидается</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{(summary.expectedRevenue || 0).toLocaleString('ru-RU')} ₽</p>
              <p className="mt-2 text-sm text-gray-500">Запланированные сессии</p>
            </div>
            <TrendingUp className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Задолженности */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-semibold text-gray-900">Задолженности</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{(summary.outstandingTotal || 0).toLocaleString('ru-RU')} ₽</p>
              <p className="mt-2 text-sm text-gray-500">Неоплаченных сессий: {summary.outstandingCount || 0}</p>
            </div>
            <AlertCircle className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Чеки */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-semibold text-gray-900">Чеки</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{summary.receiptsToSendCount || 0}</p>
              <p className="mt-2 text-sm text-gray-500">Требуют отправки</p>
            </div>
            <FileText className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Недавние транзакции */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Недавние транзакции</h2>
        </div>
        <div className="p-6">
          {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оплата</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.amount.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(t.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.payment_method || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500">Пока нет транзакций</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryScreen;