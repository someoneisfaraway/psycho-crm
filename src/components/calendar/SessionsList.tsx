import React from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { decrypt, ENCRYPTION_EVENT } from '../../utils/encryption';
import { ru } from 'date-fns/locale';
import type { Session } from '../../types/database';
// import { useAuth } from '../../contexts/AuthContext';
// import { Button } from '../ui/Button'; // Unused import

 interface SessionsListProps {
   date: Date;
   sessions: Session[];
   // onCreateSession: () => void; // Unused parameter
   onSessionClick: (session: Session) => void;
 }

 const SessionsList: React.FC<SessionsListProps> = ({ date, sessions, /* onCreateSession, */ onSessionClick }) => {
  // const { user } = useAuth();
   const [, setCryptoTick] = React.useState(0);
   React.useEffect(() => {
     const handler = () => setCryptoTick(t => t + 1);
     window.addEventListener(ENCRYPTION_EVENT, handler as EventListener);
     return () => window.removeEventListener(ENCRYPTION_EVENT, handler as EventListener);
   }, []);
   // Filter sessions for the selected date
   const dateSessions = sessions.filter(session => {
    const sessionDate = parseISO(session.scheduled_at);
     return (
       sessionDate.getDate() === date.getDate() &&
       sessionDate.getMonth() === date.getMonth() &&
       sessionDate.getFullYear() === date.getFullYear()
     );
   });

   // Sort sessions by start time
   const sortedSessions = [...dateSessions].sort((a, b) => {
    const aDate = parseISO(a.scheduled_at);
    const bDate = parseISO(b.scheduled_at);
    return aDate.getTime() - bDate.getTime();
   });

   return (
     <div className="bg-white rounded-lg shadow p-4">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-medium">
           {format(date, 'd MMMM yyyy г.', { locale: ru })}
         </h3>
         {/* Убираем кнопку «+ Новая сессия» из списка, чтобы не дублировать */}
         {/* <Button onClick={onCreateSession} size="sm">
           + Новая сессия
         </Button> */}
       </div>

       {sortedSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
           <p>На эту дату сессий нет</p>
           <p className="text-sm mt-2">Нажмите "Запланировать сессию", чтобы создать первую</p>
         </div>
       ) : (
         <div className="space-y-3">
           {sortedSessions.map((session) => (
             <div
               key={session.id}
               className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                session.status === 'completed' 
                  ? session.paid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-yellow-200 bg-yellow-50'
                  : session.status === 'cancelled' || session.status === 'missed'
                    ? 'border-red-200 bg-red-50'
                    : 'border-blue-200 bg-blue-50'
               }`}
               onClick={() => onSessionClick(session)}
             >
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-medium">Сессия #{session.session_number}</h4>
                   <p className="text-sm text-gray-600">
                    {(() => {
                      try {
                        const start = parseISO(session.scheduled_at);
                        const startStr = format(start, 'HH:mm');
                        const end = session.duration ? addMinutes(start, session.duration) : null;
                        const endStr = end ? format(end, 'HH:mm') : null;
                        return endStr ? `${startStr} - ${endStr}` : startStr;
                      } catch {
                        return 'Время не указано';
                      }
                    })()}
                   </p>
                 </div>
                 <span className={`px-2 py-1 text-xs rounded ${
                   session.status === 'completed'
                     ? session.paid
                       ? 'bg-green-100 text-green-800'
                       : 'bg-yellow-100 text-yellow-800'
                     : session.status === 'cancelled' || session.status === 'missed'
                       ? 'bg-red-100 text-red-800'
                       : 'bg-blue-100 text-blue-800'
                 }`}>
                   {session.status === 'completed'
                     ? session.paid
                       ? 'Оплачено'
                       : 'Не оплачено'
                     : session.status === 'scheduled'
                       ? 'Запланирована'
                       : session.status === 'cancelled'
                         ? 'Отменена'
                         : session.status === 'missed'
                           ? 'Пропущена'
                           : 'Перенесена'}
                 </span>
               </div>
               
              {session.note_encrypted && (
                <p className="mt-2 text-sm text-gray-700">{decrypt(session.note_encrypted) || ''}</p>
              )}
             </div>
           ))}
         </div>
       )}
     </div>
   );
 };

 export default SessionsList;
