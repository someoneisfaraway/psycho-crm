import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session } from '../../types/database';

interface CalendarGridProps {
  sessions: Session[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ sessions, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday as start of week
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'd';
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = '';

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Get sessions for this day
      const daySessions = sessions.filter(session =>
        isSameDay(parseISO(session.date), cloneDay)
      );
      
      // Count completed and unpaid sessions
      const completedSessions = daySessions.filter(s => s.status === 'completed');
      const unpaidSessions = completedSessions.filter(s => s.payment_status === 'unpaid');
      
      days.push(
        <div
          key={day.toString()}
          className={`relative min-h-24 p-1 border border-gray-200 cursor-pointer
            ${!isSameMonth(day, monthStart) ? 'bg-gray-100 text-gray-400' : ''}
            ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}
            ${isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => onDateSelect(cloneDay)}
        >
          <div className="flex justify-between">
            <span className={`text-sm ${isSameDay(day, new Date()) ? 'font-bold' : ''}`}>
              {formattedDate}
            </span>
          </div>
          
          {/* Session indicators */}
          <div className="mt-1 flex flex-wrap gap-1">
            {daySessions.slice(0, 3).map((session, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  session.status === 'completed'
                    ? session.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-50'
                    : 'bg-blue-500'
                }`}
              />
            ))}
            {daySessions.length > 3 && (
              <span className="text-xs text-gray-500">+{daySessions.length - 3}</span>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7 gap-0">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          {'<'}
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Сегодня
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {'>'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
          <div key={idx} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-rows-6 gap-0">
        {rows}
      </div>
    </div>
  );
};

// Helper function to add days
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default CalendarGrid;