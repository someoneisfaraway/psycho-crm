import React from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session } from '../../types/database';
import { Button } from '../ui/Button';

interface SessionsListProps {
  date: Date;
  sessions: Session[];
  onCreateSession: () => void;
 onSessionClick: (session: Session) => void;
}

const SessionsList: React.FC<SessionsListProps> = ({ date, sessions, onCreateSession, onSessionClick }) => {
  // Filter sessions for the selected date
  const dateSessions = sessions.filter(session => {
    const sessionDate = parseISO(session.date);
    return (
      sessionDate.getDate() === date.getDate() &&
      sessionDate.getMonth() === date.getMonth() &&
      sessionDate.getFullYear() === date.getFullYear()
    );
  });

  // Sort sessions by start time
  const sortedSessions = [...dateSessions].sort((a, b) => {
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {format(date, 'd MMMM yyyy г.', { locale: ru })}
        </h3>
        <Button onClick={onCreateSession} size="sm">
          + Новая сессия
        </Button>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>На эту дату сессий нет</p>
          <p className="text-sm mt-2">Нажмите "Новая сессия", чтобы создать первую</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                session.status === 'completed' 
                  ? session.payment_status === 'paid' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-yellow-200 bg-yellow-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
              onClick={() => onSessionClick(session)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Сессия #{session.session_number}</h4>
                  <p className="text-sm text-gray-600">
                    {session.start_time ? `${session.start_time} - ` : ''}
                    {session.end_time || 'Время не указано'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  session.status === 'completed' 
                    ? session.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-10 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {session.status === 'completed' 
                    ? session.payment_status === 'paid' 
                      ? 'Оплачено' 
                      : 'Не оплачено'
                    : 'Запланирована'}
                </span>
              </div>
              
              {session.notes && (
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                  {session.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsList;