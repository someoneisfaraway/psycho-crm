import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import BottomNavigation from './BottomNavigation';
// Добавьте импорт Outlet
import { Outlet } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

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
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-base font-bold text-gray-900">Панель управления психологической практикой</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email?.split('@')[0]}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="text-sm">
              Выйти
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Замените заглушку на Outlet */}
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;