// src/pages/FinancialSummaryScreen.tsx
import React from 'react';

const FinancialSummaryScreen: React.FC = () => {
  return (
    <div className="p-4 max-w-7xl mx-auto"> {/* Добавлен max-width и центрирование */}
      <div className="mb-6"> {/* Контейнер для заголовка и, возможно, селектора периода */}
        <h1 className="text-2xl font-bold text-gray-900">Финансовая сводка</h1>
        {/* Селектор периода будет добавлен позже в Шаге 5 */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Сетка для основных блоков информации */}
        {/* Блок Общий доход и разбивка по типам оплаты - Шаг 6 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Общий доход</h2>
          <p>Данные по доходу появятся здесь.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Разбивка по типам оплаты</h2>
          <p>Разбивка появится здесь.</p>
        </div>

        {/* Блок Должники - Шаг 7 */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2"> {/* Занимает всю ширину на md и выше */}
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Должники</h2>
          <p>Список должников появится здесь.</p>
        </div>

        {/* Блок Напоминания о чеках - Шаг 8 */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2"> {/* Занимает всю ширину на md и выше */}
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Напоминания о чеках</h2>
          <p>Напоминания появятся здесь.</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryScreen;