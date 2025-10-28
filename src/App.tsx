import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import Dashboard from './components/layout/Dashboard'; // Ваш текущий Dashboard
import CalendarScreen from './pages/CalendarScreen';
import ClientsScreen from './pages/ClientsScreen';
import FinancesScreen from './pages/FinancesScreen';
import SettingsScreen from './pages/SettingsScreen';
import './App.css';

// Компонент для защищённого маршрута
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Показать индикатор загрузки, пока проверяется сессия
    return <div>Loading...</div>;
  }

  // Если пользователь не вошёл, перенаправить на страницу авторизации
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Если пользователь вошёл, отрендерить дочерние маршруты
  // Outlet - это место, куда будут подставляться дочерние Route
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Открытые маршруты (для аутентификации) */}
            <Route path="/auth" element={<AuthScreen />} />
            {/* Корневой маршрут перенаправляет на /auth, если не авторизован, или на /calendar, если авторизован */}
            <Route path="/" element={
              <Routes>
                <Route index element={<Navigate to="/auth" />} />
                {/* Этот маршрут будет защищённым, но с редиректом на календарь */}
                <Route element={<ProtectedRoute />}>
                  {/* Редирект с / на /calendar, если пользователь авторизован */}
                  <Route path="/" element={<Navigate to="/calendar" replace />} />
                </Route>
              </Routes>
            } />

            {/* Защищённые маршруты (только для вошедших пользователей) */}
            {/* Все защищённые маршруты обёрнуты в ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              {/* Основной маршрут для Dashboard, внутри которого будут отображаться страницы */}
              {/* /calendar, /clients, /finances, /settings будут отображаться внутри Dashboard */}
              <Route path="/" element={<Dashboard />}>
                {/* Внутренние маршруты, которые отображаются внутри Dashboard через Outlet */}
                {/* Важно: path начинаются без '/' внутри Dashboard, они добавляются к родительскому пути '/' */}
                <Route path="calendar" element={<CalendarScreen />} />
                <Route path="clients" element={<ClientsScreen />} />
                <Route path="finances" element={<FinancesScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
                {/* Редирект с / (внутри защищённой зоны) на /calendar */}
                <Route index element={<Navigate to="calendar" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;