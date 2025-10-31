// src/pages/FinancialSummaryScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFinancialSummary, FinancialSummary } from '../../api/finances';

const FinancialSummaryScreen: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- НОВОЕ: Состояния для дат ---
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Первый день текущего месяца
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0); // Последний день текущего месяца
    return d.toISOString().split('T')[0];
  });

  const { user: authUser, loading: authLoading } = useAuth();

  // --- НОВОЕ: Обработчики изменения дат ---
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // useEffect теперь зависит от startDate, endDate и authUser.id
  useEffect(() => {
    const fetchSummary = async () => {
      if (!authUser?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // --- ИЗМЕНЕНО: Используем startDate и endDate из состояния ---
        const data = await getFinancialSummary(startDate, endDate, authUser.id);
        setSummary(data);
      } catch (err) {
        console.error("Error fetching financial summary:", err);
        setError("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchSummary();
    }
  }, [authUser?.id, authLoading, startDate, endDate]); // Добавлены startDate и endDate в зависимости

  // ... (отображение loading, error, summary остается прежним, но обернём заголовок и селектор в контейнер)

  if (authLoading || loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        {/* --- НОВОЕ: Обновлённый контейнер для заголовка и селектора --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Финансовая сводка</h1>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Начало периода</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <span className="mt-6">по</span>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Конец периода</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p>Загрузка финансовой информации...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        {/* --- НОВОЕ: Обновлённый контейнер для заголовка и селектора --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Финансовая сводка</h1>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Начало периода</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <span className="mt-6">по</span>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Конец периода</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        {/* --- НОВОЕ: Обновлённый контейнер для заголовка и селектора --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Финансовая сводка</h1>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Начало периода</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <span className="mt-6">по</span>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Конец периода</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p>Нет данных для отображения.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* --- НОВОЕ: Обновлённый контейнер для заголовка и селектора --- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Финансовая сводка</h1>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Начало периода</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <span className="mt-6">по</span>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Конец периода</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Данные сводки (временное отображение)</h2>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(summary, null, 2)}</pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Общий доход</h2>
          <p>Данные по доходу появятся здесь.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Разбивка по типам оплаты</h2>
          <p>Разбивка появится здесь.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Должники</h2>
          <p>Список должников появится здесь.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Напоминания о чеках</h2>
          <p>Напоминания появятся здесь.</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryScreen;