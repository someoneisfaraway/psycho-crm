import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session, Client } from '../../types/database';
import CalendarGrid from './CalendarGrid';
import SessionsList from './SessionsList';
import SessionModal from './SessionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { sessionsApi } from '../../api/sessions';
import { getClients } from '../../api/clients';

const CalendarScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, we would get the current user ID from auth context
        const userId = 'current-user-id'; // This would come from auth context in real app
        
        const [sessionsData, clientsData] = await Promise.all([
          sessionsApi.getForDate(userId, selectedDate.toISOString()),
          getClients({ userId })
        ]);
        
        setSessions(sessionsData as Session[]);
        setClients(clientsData as Client[]);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };



  const handleEditSession = (session: Session) => {
    setCurrentSession(session);
    setShowSessionModal(true);
  };

  const handleSaveSession = async (sessionData: any) => {
    try {
      if (currentSession) {
        // Update existing session
        const updatedSession = await sessionsApi.update(currentSession.id, sessionData);
        setSessions(prev => prev.map(s =>
          s.id === currentSession.id ? (updatedSession as Session) : s
        ));
      } else {
        // Create new session
        if (!sessionData.client_id) {
          setError('Выберите клиента');
          return;
        }
        const newSessionData = {
          user_id: 'current-user-id',
          client_id: sessionData.client_id,
          scheduled_at: sessionData.scheduled_at,
          duration: sessionData.duration || 50,
          status: 'scheduled',
          price: sessionData.price,
          format: sessionData.format,
          meeting_link: sessionData.meeting_link || undefined,
          note_encrypted: sessionData.note_encrypted || undefined,
        };
        const newSession = await sessionsApi.create(newSessionData as any);
        setSessions(prev => [...prev, newSession as Session]);
      }
      setShowSessionModal(false);
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Ошибка сохранения сессии');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <EmptyState title="Ошибка" description={error} />;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Календарь</h1>
        <p className="text-gray-600">
          {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarGrid 
            sessions={sessions} 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}

          />
        </div>

        <div>
          <SessionsList 
            date={selectedDate}
            sessions={sessions}
            onSessionClick={handleEditSession}
          />
        </div>
      </div>

      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSave={handleSaveSession}
        session={currentSession}
        clients={clients}
      />
    </div>
  );
};

export default CalendarScreen;