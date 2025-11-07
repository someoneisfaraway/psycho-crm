// src/components/calendar/CalendarGrid.tsx
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import type { Session } from '../../types/database'; // Импортируем тип Session

interface CalendarGridProps {
  sessions: Session[]; // Список сессий для отображения индикаторов
  selectedDate: Date | null; // Выбранная дата
  onDateSelect: (date: Date) => void; // Функция для выбора даты
  onNewSessionClick: (date: Date) => void; // Функция для создания новой сессии
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ sessions, selectedDate, onDateSelect, onNewSessionClick }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);

  // Функция для получения индикаторов сессий для конкретного дня
  const getSessionIndicators = (date: Date) => {
    // Фильтруем сессии на выбранную дату
    const sessionsForDate = sessions.filter(session => isSameDay(parseISO(session.scheduled_at), date));
    const total = sessionsForDate.length;
    if (total === 0) return null;

    // Подсчитываем оплаченные и неоплаченные
    const paid = sessionsForDate.filter(s => s.paid).length;
    const unpaid = total - paid;

    // Определяем цвет индикатора (для простоты используем зелёный/жёлтый)
    // В реальности можно использовать разные цвета или иконки
    const indicatorColor = unpaid > 0 ? 'bg-yellow-500' : 'bg-green-500';

    // Ограничиваем количество отображаемых точек
    const maxDots = 3;
    const dotsToShow = Math.min(total, maxDots);
    const hasMore = total > maxDots;

    return (
      <div className="flex justify-center mt-1">
        <div className="flex space-x-0.5">
          {Array.from({ length: dotsToShow }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></div>
          ))}
          {hasMore && <span className="text-xs text-gray-500 ml-1">+{total - maxDots}</span>}
        </div>
      </div>
    );
  };

  // Обновляем дни месяца при изменении currentDate
  useEffect(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1, locale: ru });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1, locale: ru });
    const days = [];
    let day = start;
  
    while (day <= end) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
  
    setDaysInMonth(days);
  }, [currentDate]);

  // Обработчики навигации
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Определяем, является ли день сегодняшним
  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Заголовок с навигацией */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-white rounded-md hover:bg-black/80"
          >
            Сегодня
          </button>
          <button
            onClick={prevMonth}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Предыдущий месяц"
          >
            &lt;
          </button>
          <button
            onClick={nextMonth}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Следующий месяц"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={index}
              className={`
                min-h-16 p-1 border rounded-lg flex flex-col items-center justify-start
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${isToday(day) ? 'border-2 border-blue-600' : ''}
                hover:bg-gray-50 cursor-pointer
              `}
              onClick={() => onDateSelect(day)}
            >
              <div className={`text-sm ${isToday(day) ? 'font-bold' : ''} ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              {getSessionIndicators(day)}
              {/* Кнопка создания сессии внутри дня удалена, оставляем только верхнюю кнопку на экране */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;