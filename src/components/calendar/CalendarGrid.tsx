// src/components/calendar/CalendarGrid.tsx
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale'; // Убедитесь, что локаль установлена, если нужна русская локализация
import type { Session } from '../../types/database'; // Импортируем тип Session

interface CalendarGridProps {
  sessions: Session[]; // Список сессий для отображения индикаторов
  selectedDate: Date | null; // Выбранная дата
  onDateSelect: (date: Date) => void; // Функция для выбора даты
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ sessions, selectedDate, onDateSelect }) => {
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
    const indicatorColor = unpaid > 0 ? 'bg-status-warning-bg' : 'bg-status-success-bg';

    // Ограничиваем количество отображаемых точек
    const maxDots = 3;
    const dotsToShow = Math.min(total, maxDots);
    const hasMore = total > maxDots;

    return (
      <div className="flex justify-center mt-1">
        <div className="flex space-x-1">
          {Array.from({ length: dotsToShow }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>
          ))}
          {hasMore && <span className="text-xs text-text-secondary ml-1">+{total - maxDots}</span>}
        </div>
      </div>
    );
  };

  // Режим отображения: неделя или месяц
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Обновляем дни при изменении currentDate или режима отображения
  useEffect(() => {
    let start: Date;
    let end: Date;
    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1, locale: ru });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1, locale: ru });
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 1, locale: ru });
      end = endOfWeek(currentDate, { weekStartsOn: 1, locale: ru });
    }

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    setDaysInMonth(days);
  }, [currentDate, viewMode]);

  // Обработчики навигации
  const next = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prev = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect(today);
  };

  // Определяем, является ли день сегодняшним
  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="card w-full">
      {/* Заголовок и панель управления в две строки */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h2 className="modal-title whitespace-nowrap">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap w-full">
          <button
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}
            aria-label="Показать неделю"
          >
            Неделя
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}
            aria-label="Показать месяц"
          >
            Месяц
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={prev}
              className="btn-secondary"
              aria-label={viewMode === 'month' ? 'Предыдущий месяц' : 'Предыдущая неделя'}
            >
              &lt;
            </button>
            <button onClick={goToToday} className="btn-secondary">Сегодня</button>
            <button
              onClick={next}
              className="btn-secondary"
              aria-label={viewMode === 'month' ? 'Следующий месяц' : 'Следующая неделя'}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 gap-1 mb-2 w-full">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-text-secondary py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Сетка дней: неделя или месяц */}
      <div className="grid grid-cols-7 gap-1 w-full">
        {daysInMonth.map((day, index) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={index}
              className={`
                min-h-16 p-1 border rounded-lg flex flex-col items-center justify-start
                ${isCurrentMonth ? 'bg-bg-primary' : 'bg-bg-secondary text-text-secondary'}
                ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-border-primary'}
                ${isToday(day) ? 'border-2 border-primary-600' : ''}
                hover:bg-bg-secondary cursor-pointer
              `}
              onClick={() => onDateSelect(day)}
            >
              <div className={`text-sm ${isToday(day) ? 'font-bold' : ''} ${viewMode === 'month' ? (isCurrentMonth ? 'text-text-primary' : 'text-text-secondary') : 'text-text-primary'}`}>
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
