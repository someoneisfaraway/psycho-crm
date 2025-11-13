import React, { useMemo } from 'react';
import BottomNavigation from './BottomNavigation';
// Добавьте импорт Outlet
import { Outlet, useLocation } from 'react-router-dom';
// Удалены импорты, связанные с отображением имени/выходом

const Dashboard: React.FC = () => {
  const location = useLocation();

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
