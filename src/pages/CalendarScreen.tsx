import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus } from 'lucide-react';

import CalendarGrid from '../components/calendar/CalendarGrid';
import SessionModal from '../components/calendar/SessionModal';
import SessionDetailModal from '../components/calendar/SessionDetailModal';
import SessionTransferModal from '../components/calendar/SessionTransferModal';
import { OnboardingModal } from '../components/Onboarding';
import { useAuth } from '../contexts/AuthContext';
import { sessionsApi } from '../api/sessions';
import { clientsApi } from '../api/clients';
import type { Session, Client } from '../types/database';
import { supabase } from '../config/supabase';

interface SessionWithClient extends Session {
  clients?: { id: string; name: string };
}

const CalendarScreen: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithClient[]>([]);
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<SessionWithClient[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSession, setSelectedSession] = useState<SessionWithClient | null>(null);
  const [operationError, setOperationError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const location = useLocation();
  const navState = location.state as { clientId?: string; mode?: 'create' | 'edit' | 'view' } | null;

  useEffect(() => {
    if (navState?.mode === 'create' && navState?.clientId) {
      setSelectedSession(null);
      setModalMode('create');
      setIsSessionModalOpen(true);
    }
  }, [navState]);

  useEffect(() => {
    const loadOnboardingFlag = async () => {
      if (!user?.id) { setShowOnboarding(false); return; }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
        if (error) { setShowOnboarding(true); return; }
        const completed = (data as any)?.onboarding_completed === true;
        setShowOnboarding(!completed);
      } catch {
        setShowOnboarding(true);
      }
    };
    loadOnboardingFlag();
  }, [user?.id]);

  useEffect(() => {
    const loadClients = async () => {
      if (!user?.id) return;
      try {
        const clientsData = await clientsApi.getAll(user.id);
        if (Array.isArray(clientsData)) {
          const map = clientsData.reduce((acc: Record<string, Client>, c: Client) => {
            acc[c.id] = c;
            return acc;
          }, {} as Record<string, Client>);
          setClients(map);
        } else {
          setClients({});
        }
      } catch (e) {
        console.error(e);
        setClients({});
      }
    };
    loadClients();
  }, [user?.id]);

  useEffect(() => {
    const loadInitialRange = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const sessionsData = await sessionsApi.getForDateRange(user.id, start, end);
        setSessions(Array.isArray(sessionsData) ? (sessionsData as any) : []);
        setInitialLoaded(true);
      } catch (e) {
        console.error('Failed to fetch initial calendar range', e);
        setError('Не удалось загрузить календарь. Попробуйте позже.');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    loadInitialRange();
  }, [user?.id]);

  useEffect(() => {
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      const filtered = sessions.filter(s => {
        const d = new Date(s.scheduled_at);
        return d >= startOfDay && d <= endOfDay;
      });
      filtered.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      setSessionsForSelectedDate(filtered);
    } else {
      setSessionsForSelectedDate([]);
    }
  }, [selectedDate, sessions]);

  const handleDateSelect = (date: Date) => setSelectedDate(date);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const handleRangeChange = async (start: Date, end: Date) => {
    if (!user?.id) return;
    if (!initialLoaded) setLoading(true);
    try {
      const sessionsData = await sessionsApi.getForDateRange(user.id, start, end);
      setSessions(Array.isArray(sessionsData) ? (sessionsData as any) : []);
      if (!initialLoaded) setInitialLoaded(true);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch sessions for range', e);
      if (!initialLoaded) setError('Не удалось загрузить календарь. Попробуйте позже.');
      setSessions([]);
    } finally {
      if (!initialLoaded) setLoading(false);
    }
  };
  const handleNewSessionClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSession(null);
    setModalMode('create');
    setIsSessionModalOpen(true);
  };
  const handleViewSession = (session: SessionWithClient) => {
    setSelectedSession(session);
    setIsSessionDetailModalOpen(true);
  };
  const handleEditSession = (session: SessionWithClient) => {
    setSelectedSession(session);
    setModalMode('edit');
    setIsSessionModalOpen(true);
  };
  const handleRescheduleSession = (session: SessionWithClient) => {
    setSelectedSession(session);
    setIsTransferModalOpen(true);
  };

  const handleMarkCompleted = async (id: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.markCompleted(id);
      updateLocalSessions(updated as any);
      setIsSessionDetailModalOpen(false);

      // Предложение создать следующую сессию по расписанию клиента
      if (selectedSession) {
        const client = clients[selectedSession.client_id];
        const schedule = client?.schedule;
        if (schedule === '1x/week' || schedule === '1x/2weeks') {
          const base = new Date(selectedSession.scheduled_at);
          const days = schedule === '1x/week' ? 7 : 14;
          const proposed = new Date(base.getTime());
          proposed.setDate(base.getDate() + days);
          const formatted = format(proposed, 'EEEE, d MMMM yyyy, HH:mm', { locale: ru });
          const agree = window.confirm(`Создать следующую сессию для клиента "${client?.name}" на ${formatted}?`);
          if (agree) {
            setSelectedDate(proposed);
            setSelectedSession(null);
            setModalMode('create');
            setIsSessionModalOpen(true);
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось завершить сессию');
    } finally { setIsProcessing(false); }
  };

  const handleMarkPaid = async (id: string, method: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.markPaid(id, method);
      updateLocalSessions(updated as any);
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось отметить оплату');
    } finally { setIsProcessing(false); }
  };

  const handleMarkCancelled = async (id: string) => {
    if (!confirm('Отменить эту сессию?')) return;
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.markCancelled(id);
      updateLocalSessions(updated as any);
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось отменить сессию');
    } finally { setIsProcessing(false); }
  };

  const handleMarkReceiptSent = async (id: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.markReceiptSent(id);
      updateLocalSessions(updated as any);
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось отправить чек');
    } finally { setIsProcessing(false); }
  };

  const handleUnmarkPaid = async (id: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.unmarkPaid(id);
      updateLocalSessions(updated as any);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось снять отметку об оплате');
    } finally { setIsProcessing(false); }
  };

  const handleUnmarkReceiptSent = async (id: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.unmarkReceiptSent(id);
      updateLocalSessions(updated as any);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось снять отметку о чеке');
    } finally { setIsProcessing(false); }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Удалить эту сессию безвозвратно?')) return;
    setIsProcessing(true); setOperationError('');
    try {
      await sessionsApi.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      setSessionsForSelectedDate(prev => prev.filter(s => s.id !== id));
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось удалить сессию');
    } finally { setIsProcessing(false); }
  };

  const handleRevertToScheduled = async (id: string) => {
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.update(id, { status: 'scheduled', completed_at: null } as any);
      updateLocalSessions(updated as any);
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось отменить завершение');
    } finally { setIsProcessing(false); }
  };

  const handleConfirmTransfer = async (newDateTime: Date) => {
    if (!selectedSession) return;
    setIsProcessing(true); setOperationError('');
    try {
      const updated = await sessionsApi.update(selectedSession.id, { scheduled_at: newDateTime.toISOString() } as any);
      updateLocalSessions(updated as any);
      setIsTransferModalOpen(false);
      setIsSessionDetailModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setOperationError(e?.message || 'Не удалось перенести сессию');
    } finally { setIsProcessing(false); }
  };

  const handleModalClose = () => setIsSessionModalOpen(false);

  const handleSaveSession = async (sessionData: any) => {
    if (!user?.id) { setError('Вы не авторизованы'); return; }
    try {
      const saved = modalMode === 'create'
        ? await sessionsApi.create(sessionData)
        : await sessionsApi.update(sessionData.id, sessionData);
      updateLocalSessions(saved as any);
      return saved;
    } catch (e) {
      console.error('Error saving session', e);
      throw e;
    }
  };

  const updateLocalSessions = (updated: SessionWithClient) => {
    setSessions(prev => {
      const i = prev.findIndex(s => s.id === updated.id);
      if (i >= 0) { const cp = [...prev]; cp[i] = updated; return cp; }
      return [...prev, updated];
    });
    if (selectedDate && updated.scheduled_at) {
      const d = new Date(updated.scheduled_at);
      if (isSameDay(d, selectedDate)) {
        setSessionsForSelectedDate(prev => {
          const i = prev.findIndex(s => s.id === updated.id);
          if (i >= 0) { const cp = [...prev]; cp[i] = updated; return cp; }
          const list = [...prev, updated];
          list.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          return list;
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-text-secondary">Загрузка календаря...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-container">
        <div className="card bg-status-error-bg border-status-error-border">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-status-error">Ошибка</h3>
              <div className="mt-2 text-sm text-status-error-text">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      {showOnboarding && (
        <OnboardingModal isOpen={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarGrid sessions={sessions} selectedDate={selectedDate} onDateSelect={handleDateSelect} onRangeChange={handleRangeChange} />
        </div>
        <div className="card">
          {selectedDate ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                </h2>
                <button onClick={() => handleNewSessionClick(selectedDate!)} className="btn-primary text-sm px-3 py-1 flex items-center gap-1 w-full sm:w-auto flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  Запланировать сессию
                </button>
              </div>
              {sessionsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {sessionsForSelectedDate.map((session) => {
                    const client = clients[session.client_id];
                    return (
                      <div key={session.id} className="p-3 border border-border-light rounded-lg hover:bg-background-hover cursor-pointer transition-colors" onClick={() => handleViewSession(session)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-text-primary">
                              {format(new Date(session.scheduled_at), 'HH:mm')} • {client?.name || 'Клиент'} • Сессия #{session.session_number}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'} • {session.price} ₽
                            </div>
                            <div className="text-xs mt-1">
                              {session.paid ? <span className="text-status-success">✅ Оплачено</span> : <span className="text-status-warning">⚠ Не оплачено</span>}
                              {session.status !== 'cancelled' && session.paid && session.receipt_sent ? (
                                <span className="ml-2 text-status-success">✉ Чек отправлен</span>
                              ) : session.status !== 'cancelled' && session.paid ? (
                                <span className="ml-2 text-status-warning">⏰ Чек не отправлен</span>
                              ) : null}
                            </div>
                          </div>
                          <span className={`status-badge ${session.status === 'scheduled' ? 'status-info' : session.status === 'completed' ? 'status-success' : 'status-neutral'}`}>
                            {session.status === 'scheduled' ? 'Запланирована' : session.status === 'completed' ? 'Завершена' : 'Отменена'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="mt-4 text-text-primary">Нет сессий</p>
                  <p className="text-sm text-text-secondary">На этот день запланировано 0 сессий.</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-text-secondary">Выберите дату в календаре</p>
          )}
        </div>
      </div>

      {isSessionModalOpen && (
        <SessionModal
          mode={modalMode}
          session={selectedSession as Session}
          clients={Object.values(clients)}
          isOpen={isSessionModalOpen}
          onClose={handleModalClose}
          onSave={handleSaveSession}
          selectedDate={selectedDate!}
          initialClientId={selectedSession?.client_id || navState?.clientId}
          userId={user?.id}
        />
      )}

      {isSessionDetailModalOpen && selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          client={clients[selectedSession.client_id]}
          isOpen={isSessionDetailModalOpen}
          onClose={() => { setIsSessionDetailModalOpen(false); setOperationError(''); }}
          onEdit={(s) => handleEditSession(s as SessionWithClient)}
          onReschedule={(s) => handleRescheduleSession(s as SessionWithClient)}
          onMarkCompleted={(id) => handleMarkCompleted(id)}
          onMarkPaid={(id, method) => handleMarkPaid(id, method)}
          onUnmarkPaid={(id) => handleUnmarkPaid(id)}
          onMarkCancelled={(id) => handleMarkCancelled(id)}
          onMarkReceiptSent={(id) => handleMarkReceiptSent(id)}
          onUnmarkReceiptSent={(id) => handleUnmarkReceiptSent(id)}
          onDelete={(id) => handleDeleteSession(id)}
          onRevertToScheduled={(id) => handleRevertToScheduled(id)}
          error={operationError}
          isProcessing={isProcessing}
        />
      )}

      {isTransferModalOpen && selectedSession && (
        <SessionTransferModal
          session={selectedSession}
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onTransfer={handleConfirmTransfer}
        />
      )}
    </div>
  );
};

export default CalendarScreen;
