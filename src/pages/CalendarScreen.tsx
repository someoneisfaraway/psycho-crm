// src/pages/CalendarScreen.tsx (или путь к вашему экрану календаря)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sessionsApi } from '../../api/sessions'; // Импортируем API для сессий
import { clientsApi } from '../../api/clients'; // Импортируем API для клиентов (для получения имён)
import type { Session, Client } from '../../types/database'; // Импортируем типы
import CalendarGrid from '../components/calendar/CalendarGrid'; // Импортируем компонент сетки
import SessionModal from '../components/calendar/SessionModal'; // Импортируем модальное окно сессии (создадим позже)
import { Button } from '../components/ui/Button'; // Импортируем кнопку
import { Plus } from 'lucide-react'; // Импортируем иконку

const CalendarScreen: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({}); // Словарь клиентов для быстрого доступа по ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // По умолчанию сегодня
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<Session[]>([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Загружаем сессии и клиентов при монтировании и при изменении user.id
  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);
      try {
        // Загружаем сессии для текущего пользователя
        const sessionsData = await sessionsApi.getForDateRange(user.id, new Date(2025, 0, 1), new Date(2025, 11, 31)); // Пример: загрузка на год
        setSessions(sessionsData);

        // Загружаем всех клиентов текущего пользователя для получения имён
        const clientsData = await clientsApi.getAll(user.id);
        const clientsMap = clientsData.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as Record<string, Client>);
        setClients(clientsMap);

      } catch (err) {
        console.error('Failed to fetch calendar data:', err);
        setError('Failed to load calendar data. Please try again later.');
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

  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setModalMode('view'); // Устанавливаем режим просмотра
    setIsSessionModalOpen(true); // Открываем модалку
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setModalMode('edit'); // Устанавливаем режим редактирования
    setIsSessionModalOpen(true); // Открываем модалку
  };

  const handleModalClose = () => {
    setIsSessionModalOpen(false);
    // После закрытия модалки, возможно, стоит обновить данные календаря
    // fetchCalendarData(); // Можно вызвать, если данные могли измениться
  };

  // Функция для обновления локального состояния после создания/редактирования сессии
  const updateLocalSessions = (updatedSession: Session) => {
    // Если это новая сессия
    if (!sessions.some(s => s.id === updatedSession.id)) {
      setSessions(prev => [...prev, updatedSession]);
      // И обновляем словарь клиентов, если клиента ещё нет
      if (!clients[updatedSession.client_id]) {
        // Здесь нужно будет загрузить или получить клиента по ID, чтобы добавить в словарь
        // Это требует дополнительного вызова API или передачи данных о клиенте из формы
        // Пока опустим для упрощения
      }
    } else {
      // Если это редактирование
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    }

    // Обновляем список сессий для выбранной даты
    if (selectedDate && isSameDay(new Date(updatedSession.scheduled_at), selectedDate)) {
      setSessionsForSelectedDate(prev => {
        const existingIndex = prev.findIndex(s => s.id === updatedSession.id);
        if (existingIndex >= 0) {
          const updatedList = [...prev];
          updatedList[existingIndex] = updatedSession;
          return updatedList;
        } else {
          // Если это новая сессия на эту дату
          const newList = [...prev, updatedSession];
          newList.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          return newList;
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка календаря...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Календарь</h1>
          <Button variant="outline" onClick={() => handleNewSessionClick(new Date())}>
            <Plus className="mr-2 h-4 w-4" />
            Новая сессия
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Календарь */}
          <div className="lg:col-span-2">
            <CalendarGrid
              sessions={sessions}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onNewSessionClick={handleNewSessionClick}
            />
          </div>

          {/* Список сессий для выбранной даты */}
          <div className="bg-white rounded-lg shadow p-4">
            {selectedDate ? (
              <>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() => handleNewSessionClick(selectedDate)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    + Сессия
                  </Button>
                </h2>
                {sessionsForSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {sessionsForSelectedDate.map((session) => {
                      const client = clients[session.client_id]; // Получаем имя клиента из словаря
                      return (
                        <div
                          key={session.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewSession(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">
                                {format(new Date(session.scheduled_at), 'HH:mm')} • {client?.name || 'Клиент'} • Сессия #{session.session_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {session.format === 'online' ? '💻 Онлайн' : '📍 Офлайн'} • {session.price} ₽
                              </div>
                              <div className="text-xs mt-1">
                                {session.paid ? (
                                  <span className="text-green-600">✅ Оплачено</span>
                                ) : (
                                  <span className="text-yellow-600">⚠ Не оплачено</span>
                                )}
                                {session.paid && session.receipt_sent ? (
                                  <span className="ml-2 text-green-600">✉ Чек отправлен</span>
                                ) : session.paid ? (
                                  <span className="ml-2 text-yellow-600">⏰ Чек не отправлен</span>
                                ) : null}
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              session.status === 'completed' ? 'bg-green-100 text-green-800' :
                              session.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
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
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Нет сессий</h3>
                    <p className="mt-1 text-sm text-gray-500">На этот день запланировано 0 сессий.</p>
                    <div className="mt-6">
                      <Button onClick={() => handleNewSessionClick(selectedDate)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Запланировать сессию
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Выберите дату</p>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для сессии (пока не реализовано, но место есть) */}
      {isSessionModalOpen && (
        <SessionModal
          mode={modalMode}
          session={selectedSession}
          clients={Object.values(clients)} // Передаём список клиентов
          isOpen={isSessionModalOpen}
          onClose={handleModalClose}
          onSave={updateLocalSessions} // Передаём функцию для обновления состояния
          selectedDate={selectedDate || undefined} // Передаём выбранную дату для создания новой сессии
        />
      )}
    </div>
  );
};

export default CalendarScreen;