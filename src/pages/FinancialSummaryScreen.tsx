// src/pages/FinancialSummaryScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialSummary, getTransactionsForPeriod } from '../api/finances';
import type { FinancialSummary } from '../api/finances';
import { DollarSign, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import EarnedRevenueModal from '../components/finances/EarnedRevenueModal';
import ExpectedRevenueModal from '../components/finances/ExpectedRevenueModal';
import DebtsModal from '../components/finances/DebtsModal';
import ReceiptsModal from '../components/finances/ReceiptsModal';

const FinancialSummaryScreen: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

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

  // Состояния открытия модальных окон
  const [earnedModalOpen, setEarnedModalOpen] = useState<boolean>(false);
  const [expectedModalOpen, setExpectedModalOpen] = useState<boolean>(false);
  const [debtsModalOpen, setDebtsModalOpen] = useState<boolean>(false);
  const [receiptsModalOpen, setReceiptsModalOpen] = useState<boolean>(false);

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
          {/* Заголовок перенесён в общий хедер макета */}
          <div className="text-center py-8">Загрузка финансовой информации...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Заголовок перенесён в общий хедер макета */}
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
          {/* Заголовок перенесён в общий хедер макета */}
          <div className="text-center py-8">Нет данных для отображения.</div>
        </div>
      </div>
    );
  }

  // Предварительно вычислим ISO строки для модалок
  const startISO = new Date(startDate).toISOString();
  const endISO = (() => {
    const d = new Date(endDate);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  })();

  const getPaymentMethodLabel = (method: string | null | undefined): string => {
    if (!method) return '—';
    const labels: Record<string, string> = {
      card: 'Карта',
      cash: 'Наличные',
      transfer: 'Перевод',
      platform: 'Платформа',
      'self-employed': 'Самозанятый',
      ip: 'ИП',
    };
    return labels[method] || method;
  };

  const handleExport = async () => {
    if (!authUser?.id) return;
    setExporting(true);
    try {
      const transactions = await getTransactionsForPeriod(startDate, endDate, authUser.id);
      // Подготовка данных: столбцы — дата, клиент, сумма, тип оплаты, чек отправлен
      const rows = transactions.map((t) => ({
        'Дата': new Date(t.date).toLocaleDateString('ru-RU'),
        'Клиент': t.client_name,
        'Сумма': t.amount,
        'Тип оплаты': getPaymentMethodLabel(t.payment_method),
        'Чек отправлен': t.receipt_sent ? 'Да' : 'Нет',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');
      const periodLabel = `${new Date(startDate).toLocaleDateString('ru-RU')}-${new Date(endISO).toLocaleDateString('ru-RU')}`;
      XLSX.writeFile(workbook, `Финансовый_отчет_${periodLabel}.xlsx`);
    } catch (e) {
      console.error('Ошибка экспорта отчета:', e);
      setError('Не удалось экспортировать отчет');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Заголовок перенесён в общий хедер макета */}

        {/* Модальные окна */}
        <EarnedRevenueModal
          isOpen={earnedModalOpen}
          onClose={() => setEarnedModalOpen(false)}
          userId={authUser?.id || ''}
          initialStartDate={startISO}
          initialEndDate={endISO}
        />

        <ExpectedRevenueModal
          isOpen={expectedModalOpen}
          onClose={() => setExpectedModalOpen(false)}
          userId={authUser?.id || ''}
          initialStartDate={startISO}
          initialEndDate={endISO}
        />

        <DebtsModal
          isOpen={debtsModalOpen}
          onClose={() => setDebtsModalOpen(false)}
          userId={authUser?.id || ''}
        />

        <ReceiptsModal
          isOpen={receiptsModalOpen}
          onClose={() => setReceiptsModalOpen(false)}
          userId={authUser?.id || ''}
        />

      {/* Карточки сводки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Заработано */}
        <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer" onClick={() => setEarnedModalOpen(true)}>
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
        <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer" onClick={() => setExpectedModalOpen(true)}>
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
        <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer" onClick={() => setDebtsModalOpen(true)}>
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
        <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer" onClick={() => setReceiptsModalOpen(true)}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPaymentMethodLabel(t.payment_method)}</td>
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
          {/* Кнопка экспорта отчета */}
          <div className="mt-6">
            <button
              type="button"
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleExport}
              disabled={exporting}
              aria-label="Экспортировать отчет"
            >
              <FileText className="h-5 w-5" />
              {exporting ? 'Экспорт...' : 'Экспортировать отчет'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryScreen;
