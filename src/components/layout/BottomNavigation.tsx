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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-4 transition-colors duration-200 ${
                isActive 
                  ? 'text-[#8b5cf6] bg-[#f5f3ff] border-t-2 border-[#8b5cf6]'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <IconComponent size={24} className="mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
