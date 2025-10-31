// src/pages/FinancialSummaryScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Импортируем контекст аутентификации
import { getFinancialSummary, FinancialSummary } from '../../api/finances'; // Импортируем API функцию и тип

const FinancialSummaryScreen: React.FC = () => {
  // Состояния для данных, загрузки и ошибки
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Начальное состояние - загрузка
  const [error, setError] = useState<string | null>(null);

  const { user: authUser, loading: authLoading } = useAuth(); // Получаем данные из контекста

  // useEffect для загрузки данных при монтировании или изменении userId
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
        // Используем фиксированный период для начала (например, текущий месяц)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const data = await getFinancialSummary(startOfMonth, endOfMonth, authUser.id);
        setSummary(data);
      } catch (err) {
        console.error("Error fetching financial summary:", err);
        setError("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    // Запускаем загрузку только если аутентификация завершена и есть пользователь
    if (!authLoading) {
      fetchSummary();
    }
  }, [authUser?.id, authLoading]); // Зависимости: userId и статус аутентификации

  // Отображение в зависимости от состояния
  if (authLoading || loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Финансовая сводка</h1>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Финансовая сводка</h1>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    // На всякий случай, если данные не пришли, но ошибки нет
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Финансовая сводка</h1>
        </div>
        <div className="text-center py-8">
          <p>Нет данных для отображения.</p>
        </div>
      </div>
    );
  }

  // Временное отображение данных для проверки
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Финансовая сводка</h1>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Данные сводки (временное отображение)</h2>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(summary, null, 2)}</pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Эти блоки будут заполняться реальными данными из 'summary' в следующих шагах */}
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