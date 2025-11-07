import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, DollarSign, Settings } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Календарь',
      path: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Клиенты',
      path: '/clients',
      icon: Users,
    },
    {
      name: 'Финансы',
      path: '/finances',
      icon: DollarSign,
    },
    {
      name: 'Настройки',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-4 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
            >
              <IconComponent size={24} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;