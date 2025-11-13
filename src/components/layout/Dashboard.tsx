import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BottomNavigation from './BottomNavigation';
// Добавьте импорт Outlet
import { Outlet, useLocation } from 'react-router-dom';
import { useUserDisplayName } from '../../utils/useUserDisplayName';

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const displayName = useUserDisplayName();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      // После выхода пользователь будет автоматически перенаправлен на экран авторизации
      // благодаря ProtectedRoute в App.tsx, но на всякий случай оставим редирект
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const screenTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/calendar')) return 'Календарь';
    if (path.startsWith('/clients')) return 'Клиенты';
    if (path.startsWith('/finances')) return 'Финансы';
    if (path.startsWith('/settings')) return 'Настройки';
    return '';
  }, [location.pathname]);

  return (
    <div className="app-container pb-16">
      <header className="bg-white shadow-md border-b border-neutral-200">
        <div className="screen-container flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-900">{screenTitle}</h1>
        </div>
      </header>
      <main className="screen-container">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
