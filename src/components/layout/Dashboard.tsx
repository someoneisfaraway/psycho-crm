import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import BottomNavigation from './BottomNavigation';
// Добавьте импорт Outlet
import { Outlet } from 'react-router-dom';
import { useUserDisplayName } from '../../utils/useUserDisplayName';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const displayName = useUserDisplayName();

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

  return (
    <div className="app-container pb-16">
      <header className="bg-white shadow-md border-b border-neutral-200">
        <div className="screen-container flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-900">Панель управления психологической практикой</h1>
          <div className="flex items-center space-x-4">
            <span className="text-neutral-700">{displayName}</span>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm" 
              className="btn-secondary"
            >
              Выйти
            </Button>
          </div>
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
