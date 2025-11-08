// src/pages/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionsApi } from '../api/sessions'; // Импортируем API для сессий
import { clientsApi } from '../api/clients'; // Импортируем API для клиентов (для получения имён)
import type { Session, Client } from '../types/database'; // Импортируем типы
import CalendarGrid from '../components/calendar/CalendarGrid'; // Импортируем компонент сетки
import SessionModal from '../components/calendar/SessionModal'; // Импортируем модальное окно сессии (для создания/редактирования)
import SessionDetailModal from '../components/calendar/SessionDetailModal'; // Импортируем модальное окно деталей сессии
// import { Button } from '../components/ui/Button'; // Кнопка больше не используется здесь
import { Plus } from 'lucide-react'; // Импортируем иконку
import { format, isSameDay } from 'date-fns'; // Импортируем функции из date-fns
import { ru } from 'date-fns/locale'; // Импортируем русскую локаль
import { useLocation } from 'react-router-dom';
// Удалены импорты отладочных утилит

// Интерфейс для сессии с информацией о клиенте (для отображения в календаре)
interface SessionWithClient extends Session {
  clients?: {
    id: string;
    name: string;
  };
}

const CalendarScreen: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithClient[]>([]);
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<SessionWithClient[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({}); // Словарь клиентов для быстрого доступа по ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // По умолчанию сегодня
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] = useState(false); // Новое состояние для детального модала
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSession, setSelectedSession] = useState<SessionWithClient | null>(null);
  const [operationError, setOperationError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const location = useLocation();
  const navState = location.state as { clientId?: string; mode?: 'create' | 'edit' | 'view' } | null;

  useEffect(() => {
    if (navState?.mode === 'create' && navState?.clientId) {
      setSelectedSession(null);
      setModalMode('create');
      setIsSessionModalOpen(true);
    }
  }, [navState]);

  // Загружаем сессии и клиентов при монтировании и при изменении user.id
  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);
      try {
        // Загружаем сессии для текущего пользователя за ближайший месяц (или другой диапазон)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        console.log('Loading sessions for date range:', startOfMonth, 'to', endOfMonth);
        const sessionsData = await sessionsApi.getForDateRange(user.id, startOfMonth, endOfMonth);
        console.log('Loaded sessions from DB:', sessionsData);
        if (sessionsData && Array.isArray(sessionsData) && sessionsData.length > 0) {
          // Check if the first item has the expected structure
          const hasValidStructure = sessionsData[0] && typeof sessionsData[0] === 'object' && 'id' in sessionsData[0];
          if (hasValidStructure) {
            setSessions(sessionsData as unknown as SessionWithClient[]);
          } else {
            console.warn('Sessions data has invalid structure:', sessionsData);
            setSessions([]);
          }
        } else {
          setSessions([]);
        }

        // Загружаем всех клиентов текущего пользователя для получения имён
        const clientsData = await clientsApi.getAll(user.id);
        if (clientsData && Array.isArray(clientsData)) {
          const clientsMap = clientsData.reduce((acc: Record<string, Client>, client: Client) => {
            acc[client.id] = client;
            return acc;
          }, {} as Record<string, Client>);
          setClients(clientsMap);
        } else {
          setClients({});
        }

      } catch (err) {
        console.error('Failed to fetch calendar data:', err);
        setError('Failed to load calendar data. Please try again later.');
        setSessions([]);
        setClients({});
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [user?.id]);

  // Обновляем список сессий для выбранной даты
  useEffect(() => {
    if (selectedDate && sessions.length > 0) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduled_at);
        return sessionDate >= startOfDay && sessionDate <= endOfDay;
      });

      // Сортируем по времени
      filteredSessions.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

      setSessionsForSelectedDate(filteredSessions);
    } else {
      setSessionsForSelectedDate([]);
    }
  }, [selectedDate, sessions]);

  // Обработчики
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleNewSessionClick = (date: Date) => {
    setSelectedDate(date); // Устанавливаем дату
    setSelectedSession(null); // Сбрасываем выбранную сессию
    setModalMode('create'); // Устанавливаем режим создания
    setIsSessionModalOpen(true); // Открываем модалку
  };

  // Обработчик открытия детального модального окна
  const handleViewSession = (session: SessionWithClient) => {
    // Псевдо-расшифровка заметки для передачи в SessionModal/SessionDetailModal (в реальности должна быть реальная расшифровка с ключом)
    // const decryptedNote = session.note_encrypted ? decrypt(session.note_encrypted) : '';
    // setSelectedSession({ ...session, note: decryptedNote }); // Передаём расшифрованную заметку как `note`
    setSelectedSession(session); // Пока передаём как есть
    setIsSessionDetailModalOpen(true); // Открываем детальный модал
  };

  // Обработчик открытия модального окна редактирования
  const handleEditSession = (session: SessionWithClient) => {
    // Псевдо-расшифровка заметки для передачи в SessionModal/SessionDetailModal (в реальности должна быть реальная расшифровка с ключом)
    // const decryptedNote = session.note_encrypted ? decrypt(session.note_encrypted) : '';
    // setSelectedSession({ ...session, note: decryptedNote }); // Передаём расшифрованную заметку как `note`
    setSelectedSession(session); // Пока передаём как есть
    setModalMode('edit'); // Устанавливаем режим редактирования
    setIsSessionModalOpen(true); // Открываем модалку редактирования
  };

  // Обработчики действий из детального модального окна
  const handleMarkCompleted = async (id: string) => {
    setIsProcessing(true);
    setOperationError('');
    
    try {
      const updatedSession = await sessionsApi.markCompleted(id);
      if (updatedSession && !('error' in updatedSession)) {
        updateLocalSessions(updatedSession);
        setIsSessionDetailModalOpen(false);
      } else if (updatedSession && 'error' in updatedSession) {
        // API вернуло ошибку
        throw new Error(updatedSession.error);
      }
    } catch (err: any) {
      console.error('Failed to mark session as completed:', err);
      
      let errorMessage = 'Не удалось отметить сессию как завершенную. Попробуйте еще раз.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Сессия не найдена. Возможно, она была удалена.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Невозможно завершить сессию. Проверьте статус сессии.';
      }
      
      setOperationError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Обработчик отметки оплаты - принимает ID и метод оплаты
  const handleMarkPaid = async (id: string, paymentMethod: string) => {
    setIsProcessing(true);
    setOperationError('');
    
    try {
      const updatedSession = await sessionsApi.markPaid(id, paymentMethod);
      if (updatedSession && !('error' in updatedSession)) {
        updateLocalSessions(updatedSession);
        setIsSessionDetailModalOpen(false);
      } else if (updatedSession && 'error' in updatedSession) {
        throw new Error(updatedSession.error);
      }
    } catch (err: any) {
      console.error('Failed to mark session as paid:', err);
      
      let errorMessage = 'Не удалось отметить сессию как оплаченную. Попробуйте еще раз.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Сессия не найдена. Возможно, она была удалена.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Невозможно отметить оплату. Проверьте статус сессии.';
      }
      
      setOperationError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // НОВЫЙ ОБРАБОТЧИК: Обработчик отмены сессии
  const handleMarkCancelled = async (id: string) => {
    // Подтверждение действия
    if (window.confirm("Вы уверены, что хотите отменить эту сессию?")) {
      setIsProcessing(true);
      setOperationError('');
      
      try {
        // Вызываем функцию API для отмены сессии
        const updatedSession = await sessionsApi.markCancelled(id);
        if (updatedSession && !('error' in updatedSession)) {
          updateLocalSessions(updatedSession);
          setIsSessionDetailModalOpen(false);
        } else if (updatedSession && 'error' in updatedSession) {
          throw new Error(updatedSession.error);
        }
      } catch (err: any) {
        console.error('Failed to mark session as cancelled:', err);
        
        let errorMessage = 'Не удалось отменить сессию. Попробуйте еще раз.';
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.status === 404) {
          errorMessage = 'Сессия не найдена. Возможно, она была удалена.';
        } else if (err.response?.status === 400) {
          errorMessage = 'Невозможно отменить сессию. Проверьте статус сессии.';
        }
        
        setOperationError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleMarkReceiptSent = async (id: string) => {
    setIsProcessing(true);
    setOperationError('');
    
    try {
      const updatedSession = await sessionsApi.markReceiptSent(id);
      if (updatedSession && !('error' in updatedSession)) {
        updateLocalSessions(updatedSession);
        setIsSessionDetailModalOpen(false);
      } else if (updatedSession && 'error' in updatedSession) {
        throw new Error(updatedSession.error);
      }
    } catch (err: any) {
      console.error('Failed to send receipt:', err);
      
      let errorMessage = 'Не удалось отправить чек. Попробуйте еще раз.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 404) {
        errorMessage = 'Сессия не найдена. Возможно, она была удалена.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Невозможно отправить чек. Проверьте статус сессии.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Ошибка сервера при отправке чека. Попробуйте позже.';
      }
      
      setOperationError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Снять отметку оплаты
  const handleUnmarkPaid = async (id: string) => {
    setIsProcessing(true);
    setOperationError('');

    try {
      const updatedSession = await sessionsApi.unmarkPaid(id);
      if (updatedSession && !('error' in updatedSession)) {
        updateLocalSessions(updatedSession);
        setIsSessionDetailModalOpen(false);
      } else if (updatedSession && 'error' in updatedSession) {
        throw new Error(updatedSession.error);
      }
    } catch (err: any) {
      console.error('Failed to unmark session as paid:', err);
      let errorMessage = 'Не удалось снять отметку об оплате. Попробуйте ещё раз.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setOperationError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Снять отметку отправки чека
  const handleUnmarkReceiptSent = async (id: string) => {
    setIsProcessing(true);
    setOperationError('');

    try {
      const updatedSession = await sessionsApi.unmarkReceiptSent(id);
      if (updatedSession && !('error' in updatedSession)) {
        updateLocalSessions(updatedSession);
        setIsSessionDetailModalOpen(false);
      } else if (updatedSession && 'error' in updatedSession) {
        throw new Error(updatedSession.error);
      }
    } catch (err: any) {
      console.error('Failed to unmark receipt as sent:', err);
      let errorMessage = 'Не удалось снять отметку о чеке. Попробуйте ещё раз.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setOperationError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция переноса сессии не используется и удалена для устранения ошибки TS6133



  const handleModalClose = () => {
    setIsSessionModalOpen(false);
    // Сбросим выбранную сессию при закрытии, чтобы избежать "артефактов" при повторном открытии
    // setSelectedSession(null); // Опционально
  };

  // Функция для сохранения сессии в БД
  const handleSaveSession = async (sessionData: any) => {
    console.log('handleSaveSession called with:', sessionData);
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('Client ID from sessionData:', sessionData.client_id);
    console.log('Client ID type:', typeof sessionData.client_id);
    
    if (!user?.id) {
      console.error('User is not authenticated!');
      setError('Ошибка: Пользователь не авторизован. Пожалуйста, войдите снова.');
      return;
    }
    
    try {
      let savedSession: SessionWithClient;

      if (modalMode === 'create') {
        // Создаем новую сессию в БД
        console.log('Creating session with data:', sessionData);
        savedSession = await sessionsApi.create(sessionData);
        console.log('Session created successfully:', savedSession);
      } else {
        // Обновляем существующую сессию в БД
        console.log('Updating session with data:', sessionData);
        savedSession = await sessionsApi.update(sessionData.id, sessionData);
        console.log('Session updated successfully:', savedSession);
      }

      // Обновляем локальное состояние с данными из БД
      updateLocalSessions(savedSession);
      
      return savedSession;
    } catch (err) {
      console.error('Error saving session to database:', err);
      throw err;
    }
  };

  // Функция для обновления локального состояния после создания/редактирования сессии
  const updateLocalSessions = (updatedSessionData: SessionWithClient) => {
    try {
      console.log('updateLocalSessions called with:', updatedSessionData);
      const updatedSession = updatedSessionData as SessionWithClient;
      // Всегда обновляем по ID; если записи нет — добавляем.
      console.log('Upserting session in local state by ID:', updatedSession.id);
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === updatedSession.id);
        if (existingIndex >= 0) {
          const updatedList = [...prev];
          updatedList[existingIndex] = updatedSession;
          return updatedList;
        }
        return [...prev, updatedSession];
      });

      if (selectedDate && updatedSession.scheduled_at) {
        const sessionDate = new Date(updatedSession.scheduled_at);
        if (isSameDay(sessionDate, selectedDate)) {
          setSessionsForSelectedDate(prev => {
            const existingIndex = prev.findIndex(s => s.id === updatedSession.id);
            if (existingIndex >= 0) {
              const updatedList = [...prev];
              updatedList[existingIndex] = updatedSession;
              return updatedList;
            } else {
              const newList = [...prev, updatedSession];
              newList.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
              return newList;
            }
          });
        }
      }
      console.log('Local sessions updated successfully');
    } catch (err) {
      console.error('Error updating local sessions:', err);
      setError('Не удалось обновить данные сессии. Попробуйте ещё раз.');
    }
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
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
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-status-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
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

  // Удалены обработчики отладочных действий

  return (
    <div className="screen-container">
      {/* Удалены отладочные кнопки */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Календарь</h1>
        {/* Убираем кнопку «Новая сессия», оставляем только вариант внутри правой панели */}
        {/* <Button variant="default" onClick={() => handleNewSessionClick(new Date())}>
          <Plus className="mr-2 h-4 w-4" />
          Новая сессия
        </Button> */}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Календарь */}
          <div className="lg:col-span-2">
            <CalendarGrid
              sessions={sessions}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Список сессий для выбранной даты */}
          <div className="card">
            {selectedDate ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                  </h2>
                  <button
                    onClick={() => handleNewSessionClick(selectedDate!)}
                    className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Запланировать сессию
                  </button>
                </div>
                {sessionsForSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {sessionsForSelectedDate.map((session) => {
                      const client = clients[session.client_id]; // Получаем имя клиента из словаря
                      return (
                        <div
                          key={session.id}
                          className="p-3 border border-border-light rounded-lg hover:bg-background-hover cursor-pointer transition-colors"
                          onClick={() => handleViewSession(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-text-primary">
                                {format(new Date(session.scheduled_at), 'HH:mm')} • {client?.name || 'Клиент'} • Сессия #{session.session_number}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'} • {session.price} ₽
                              </div>
                              <div className="text-xs mt-1">
                                {session.paid ? (
                                  <span className="text-status-success">✅ Оплачено</span>
                                ) : (
                                  <span className="text-status-warning">⚠ Не оплачено</span>
                                )}
                                {session.paid && session.receipt_sent ? (
                                  <span className="ml-2 text-status-success">✉ Чек отправлен</span>
                                ) : session.paid ? (
                                  <span className="ml-2 text-status-warning">⏰ Чек не отправлен</span>
                                ) : null}
                              </div>
                            </div>
                            <span className={`status-badge ${
                              session.status === 'scheduled' ? 'status-info' :
                              session.status === 'completed' ? 'status-success' :
                              session.status === 'cancelled' ? 'status-neutral' : 'status-neutral'
                            }`}>
                              {session.status === 'scheduled' ? 'Запланирована' : session.status === 'completed' ? 'Завершена' : 'Отменена'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M3 15h18M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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

        {/* Модальные окна */}
        {isSessionModalOpen && (
          <SessionModal
            mode={modalMode}
            session={selectedSession as Session}
            clients={Object.values(clients)} // Передаём список клиентов
            isOpen={isSessionModalOpen}
            onClose={handleModalClose}
            onSave={handleSaveSession}
            selectedDate={selectedDate!}
            initialClientId={navState?.clientId}
            userId={user?.id} // Передаём ID текущего пользователя
          />
        )}
        {isSessionDetailModalOpen && selectedSession && (
          <SessionDetailModal
            session={selectedSession}
            client={clients[selectedSession.client_id]} // Передаём клиента, связанного с сессией
            isOpen={isSessionDetailModalOpen}
            onClose={() => {
              setIsSessionDetailModalOpen(false);
              setOperationError(''); // Очищаем ошибку при закрытии
            }}
            onEdit={(session) => handleEditSession(session)}
            onMarkCompleted={(id) => handleMarkCompleted(id)}
            onMarkPaid={(id, method) => handleMarkPaid(id, method)}
            onUnmarkPaid={(id) => handleUnmarkPaid(id)}
            onMarkCancelled={(id) => handleMarkCancelled(id)}

            onMarkReceiptSent={(id) => handleMarkReceiptSent(id)}
            onUnmarkReceiptSent={(id) => handleUnmarkReceiptSent(id)}
            error={operationError}
            isProcessing={isProcessing}
          />
        )}
      </div>
  );
}

export default CalendarScreen;
