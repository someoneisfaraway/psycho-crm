import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Session, Client } from '../../types/database';
import CalendarGrid from './CalendarGrid';
import SessionsList from './SessionsList';
import SessionModal from './SessionModal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

const CalendarScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data loading - in real app this would come from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock sessions data
        const mockSessions: Session[] = [
          {
            id: '1',
            client_id: '1',
            user_id: 'user1',
            session_number: 1,
            date: new Date().toISOString(),
            start_time: '10:00',
            end_time: '11:00',
            status: 'completed',
            payment_status: 'paid',
            payment_amount: 5000,
            notes: 'Первая сессия с новым клиентом',
            receipt_sent: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            client_id: '2',
            user_id: 'user1',
            session_number: 2,
            date: new Date().toISOString(),
            start_time: '14:00',
            end_time: '15:00',
            status: 'scheduled',
            payment_status: 'pending',
            payment_amount: 5000,
            notes: 'Плановая сессия',
            receipt_sent: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            client_id: '3',
            user_id: 'user1',
            session_number: 3,
            date: new Date(Date.now() + 8640000).toISOString(), // tomorrow
            start_time: '16:00',
            end_time: '17:00',
            status: 'scheduled',
            payment_status: 'pending',
            payment_amount: 5000,
            notes: 'Новая сессия',
            receipt_sent: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        // Mock clients data
        const mockClients: Client[] = [
          {
            id: '1',
            user_id: 'user1',
            client_id: 'client1',
            first_name: 'Анна',
            last_name: 'Иванова',
            email: 'anna@example.com',
            phone: '+79991234567',
            birth_date: '1990-05-15',
            gender: 'female',
            notes: 'Клиент с опытом терапии',
            encrypted_notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            user_id: 'user1',
            client_id: 'client2',
            first_name: 'Мария',
            last_name: 'Петрова',
            email: 'maria@example.com',
            phone: '+79991234568',
            birth_date: '1985-10-20',
            gender: 'female',
            notes: 'Новый клиент',
            encrypted_notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '3',
            user_id: 'user1',
            client_id: 'client3',
            first_name: 'Дмитрий',
            last_name: 'Сидоров',
            email: 'dmitry@example.com',
            phone: '+79991234569',
            birth_date: '1980-03-10',
            gender: 'male',
            notes: 'Клиент с тревожностью',
            encrypted_notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active'
          }
        ];
        
        setSessions(mockSessions);
        setClients(mockClients);
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

  const handleCreateSession = () => {
    setCurrentSession(undefined);
    setShowSessionModal(true);
  };

  const handleEditSession = (session: Session) => {
    setCurrentSession(session);
    setShowSessionModal(true);
  };

  const handleSaveSession = (sessionData: Partial<Session>) => {
    if (currentSession) {
      // Update existing session
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id ? { ...s, ...sessionData } as Session : s
      ));
    } else {
      // Create new session
      const newSession: Session = {
        id: `session_${Date.now()}`,
        user_id: 'user1', // In real app, this would come from auth context
        client_id: sessionData.client_id || '',
        session_number: sessions.length + 1,
        date: sessionData.date || new Date().toISOString(),
        start_time: sessionData.start_time || '',
        end_time: sessionData.end_time || '',
        status: sessionData.status || 'scheduled',
        payment_status: sessionData.payment_status || 'pending',
        payment_amount: sessionData.payment_amount || 0,
        notes: sessionData.notes || '',
        receipt_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSessions(prev => [...prev, newSession]);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <EmptyState title="Ошибка" message={error} />;
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
            onCreateSession={handleCreateSession}
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